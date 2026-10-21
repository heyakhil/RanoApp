import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { notifyUser } from './notification.service.js';
import { digitsAfterDecimal, fetchMarketQuotes } from './quote.service.js';

const TWO_DIGIT_MULTIPLIER = 70;
const ONE_DIGIT_MULTIPLIER = 9;

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isMarketOpen(openTime, closeTime, now = new Date()) {
  const parts = indiaDateTimeParts(now);
  const current = Number(parts.hour) * 60 + Number(parts.minute);
  const open = toMinutes(openTime);
  const close = toMinutes(closeTime);

  if (close < open) {
    return current >= open || current < close;
  }

  return current >= open && current < close;
}

function moneyNumber(value) {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

function indiaDateKey(value) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function indiaDateTimeParts(value) {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(value)
      .filter((part) => part.type !== 'literal')
      .map(({ type, value: partValue }) => [type, partValue]),
  );
}

function nextIndiaDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

export function sessionCloseForEntry(openTime, closeTime, createdAt) {
  const parts = indiaDateTimeParts(createdAt);
  const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);
  const openMinutes = toMinutes(openTime);
  const closeMinutes = toMinutes(closeTime);
  let dateKey = `${parts.year}-${parts.month}-${parts.day}`;

  if (closeMinutes < openMinutes && currentMinutes >= openMinutes) {
    dateKey = nextIndiaDate(dateKey);
  }

  return new Date(`${dateKey}T${closeTime}:00+05:30`);
}

/** India date the session that closes at `closeAt` opened on. */
function sessionDate(openTime, closeTime, closeAt) {
  const closeDay = new Date(`${indiaDateKey(closeAt)}T00:00:00.000Z`);
  if (toMinutes(closeTime) < toMinutes(openTime)) {
    closeDay.setUTCDate(closeDay.getUTCDate() - 1);
  }

  return closeDay;
}

function settlementDate(now = new Date()) {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  return new Date(`${formatted}T00:00:00.000Z`);
}

function uniqueConstraint(error) {
  if (error?.code !== 'P2002') return '';
  const target = error.meta?.target;
  return Array.isArray(target) ? target.join(',') : String(target ?? '');
}

export function splitCommission(betAmount) {
  const totalPaise = Math.round(Number(betAmount) * 100);
  const commissionPaise = Math.round((totalPaise * env.commissionPercent) / 100);
  const adminPaise = Math.floor(commissionPaise / 2);

  return {
    commissionAmount: commissionPaise / 100,
    adminShare: adminPaise / 100,
    subadminShare: (commissionPaise - adminPaise) / 100,
  };
}

async function creditBetCommission(tx, entry) {
  const shares = splitCommission(entry.amount);
  if (shares.commissionAmount === 0) return;

  const accounts = await tx.adminAccount.findMany({
    where: { role: { in: ['admin', 'subadmin'] } },
    select: { id: true, role: true },
  });
  const accountByRole = new Map(accounts.map((account) => [account.role, account]));
  const adminAccount = accountByRole.get('admin');
  const subadminAccount = accountByRole.get('subadmin');

  if (!adminAccount || !subadminAccount) {
    throw new ApiError(
      503,
      'Admin and subadmin commission accounts must be configured before bets can be placed',
      'COMMISSION_ACCOUNTS_NOT_CONFIGURED',
    );
  }

  const commissionRows = [
    { account: adminAccount, role: 'admin', amount: shares.adminShare },
    { account: subadminAccount, role: 'subadmin', amount: shares.subadminShare },
  ].filter((row) => row.amount > 0);

  for (const row of commissionRows) {
    await tx.adminAccount.update({
      where: { id: row.account.id },
      data: { commissionBalance: { increment: row.amount } },
    });
  }

  await tx.commissionEntry.createMany({
    data: commissionRows.map((row) => ({
      marketId: entry.marketId,
      roundNumber: entry.roundNumber,
      marketEntryId: entry.id,
      accountId: row.account.id,
      role: row.role,
      amount: row.amount,
    })),
  });
}

async function roundTotals(markets) {
  if (markets.length === 0) {
    return new Map();
  }

  const grouped = await prisma.marketEntry.groupBy({
    by: ['marketId', 'roundNumber'],
    _sum: { amount: true },
    _count: { _all: true },
  });

  return new Map(
    grouped.map((group) => [
      `${group.marketId}:${group.roundNumber}`,
      {
        participants: group._count._all,
        totalBetAmount: moneyNumber(group._sum.amount),
      },
    ]),
  );
}

export function toPublicMarket(market, totals, lastResultAt = null) {
  const participants = totals?.participants ?? market.participants;

  return {
    id: market.id,
    name: market.name,
    symbol: market.symbol,
    imageUrl: market.imageUrl ?? '',
    openTime: market.openTime,
    closeTime: market.closeTime,
    maxParticipants: market.maxParticipants,
    participants,
    minBetAmount: moneyNumber(market.minBetAmount),
    maxBetAmount: moneyNumber(market.maxBetAmount),
    totalBetAmount: totals?.totalBetAmount ?? 0,
    currentRound: market.currentRound,
    lastResult: market.lastResult,
    lastResultAt,
    createdAt: market.createdAt,
    updatedAt: market.updatedAt,
  };
}

export async function presentMarket(market) {
  const [aggregate, latestResult] = await Promise.all([
    prisma.marketEntry.aggregate({
      where: { marketId: market.id, roundNumber: market.currentRound },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.marketRound.aggregate({
      where: { marketId: market.id },
      _max: { settledAt: true },
    }),
  ]);

  return toPublicMarket(market, {
    participants: aggregate._count._all,
    totalBetAmount: moneyNumber(aggregate._sum.amount),
  }, latestResult._max.settledAt);
}

export async function listMarketsWithTotals() {
  const markets = await prisma.market.findMany({
    orderBy: [{ openTime: 'asc' }, { createdAt: 'asc' }],
  });
  if (markets.length === 0) {
    return [];
  }

  const [totals, latestResults] = await Promise.all([
    roundTotals(markets),
    prisma.marketRound.groupBy({
      by: ['marketId'],
      where: { marketId: { in: markets.map((market) => market.id) } },
      _max: { settledAt: true },
    }),
  ]);
  const resultAtByMarket = new Map(
    latestResults.map((result) => [result.marketId, result._max.settledAt]),
  );

  return markets.map((market) =>
    toPublicMarket(
      market,
      totals.get(`${market.id}:${market.currentRound}`),
      resultAtByMarket.get(market.id),
    ),
  );
}

export async function listUserOrders(userId, { page, pageSize }) {
  const entriesWithExtra = await prisma.marketEntry.findMany({
    where: { userId },
    include: { market: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: (page - 1) * pageSize,
    take: pageSize + 1,
  });
  const hasMore = entriesWithExtra.length > pageSize;
  const entries = entriesWithExtra.slice(0, pageSize);

  if (entries.length === 0) {
    return {
      items: [],
      pagination: { page, pageSize, hasMore: false },
    };
  }

  const roundKeys = entries.map((entry) => ({
    marketId: entry.marketId,
    roundNumber: entry.roundNumber,
  }));
  const marketIds = [...new Set(entries.map((entry) => entry.marketId))];
  const [rounds, grouped] = await Promise.all([
    prisma.marketRound.findMany({ where: { marketId: { in: marketIds } } }),
    prisma.marketEntry.groupBy({
      by: ['marketId', 'roundNumber'],
      where: { OR: roundKeys },
      _count: { _all: true },
      _min: { createdAt: true },
    }),
  ]);

  const items = entries.map((entry) => {
    const exactRound = rounds.find(
      (round) =>
        round.marketId === entry.marketId && round.roundNumber === entry.roundNumber,
    );
    const isLiveRound = entry.roundNumber === entry.market.currentRound && !exactRound;
    const betDate = indiaDateKey(entry.createdAt);
    const settled =
      exactRound ??
      (isLiveRound
        ? undefined
        : rounds.find(
            (round) =>
              round.marketId === entry.marketId &&
              indiaDateKey(round.settledOn) === betDate,
          ));
    const isCurrentRound = isLiveRound;
    const liveCount = grouped.find(
      (group) =>
        group.marketId === entry.marketId && group.roundNumber === entry.roundNumber,
    );
    const roundStartedAt = liveCount?._min.createdAt ?? entry.createdAt;
    const participants = isCurrentRound
      ? liveCount?._count._all ?? 0
      : settled?.participantCount ?? liveCount?._count._all ?? 0;
    const scheduledResultAt = new Date(
      sessionCloseForEntry(
        entry.market.openTime,
        entry.market.closeTime,
        roundStartedAt,
      ).getTime() +
        env.resultDelayMinutes * 60 * 1000,
    );

    return {
      id: entry.id,
      marketName: entry.market.name,
      symbol: entry.market.symbol,
      imageUrl: entry.market.imageUrl ?? '',
      entryAmount: moneyNumber(entry.amount),
      pickedNumber: entry.pickedNumber,
      payoutAmount: entry.payoutAmount == null ? null : moneyNumber(entry.payoutAmount),
      roundNumber: entry.roundNumber,
      participants,
      maxParticipants: entry.market.maxParticipants,
      seatsLeft: Math.max(0, entry.market.maxParticipants - participants),
      openTime: entry.market.openTime,
      closeTime: entry.market.closeTime,
      result: settled?.result ?? null,
      roundStatus: settled?.status ?? (isLiveRound ? 'pending' : 'settled'),
      isCurrentRound,
      createdAt: entry.createdAt,
      scheduledResultAt: scheduledResultAt.toISOString(),
    };
  });

  return {
    items,
    pagination: { page, pageSize, hasMore },
  };
}

export async function listJoinedMarketIds(userId) {
  const markets = await prisma.market.findMany({
    select: { id: true, currentRound: true },
  });

  if (markets.length === 0) {
    return [];
  }

  const entries = await prisma.marketParticipation.findMany({
    where: {
      userId,
      OR: markets.map((market) => ({
        marketId: market.id,
        roundNumber: market.currentRound,
      })),
    },
    select: { marketId: true },
  });

  return entries.map((entry) => entry.marketId);
}

async function rejectBetForUnsettledStaleRound(marketId, now = new Date()) {
  const market = await prisma.market.findUnique({ where: { id: marketId } });
  if (!market) {
    return;
  }

  const firstEntry = await prisma.marketEntry.findFirst({
    where: { marketId, roundNumber: market.currentRound },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });
  if (!firstEntry || !isResultDue(market, now, firstEntry.createdAt)) {
    return;
  }

  const closeAt = sessionCloseForEntry(
    market.openTime,
    market.closeTime,
    firstEntry.createdAt,
  );
  if (indiaDateKey(now) !== indiaDateKey(closeAt)) {
    throw new ApiError(
      409,
      'The previous market round is waiting for its result',
      'MARKET_RESULT_PENDING',
    );
  }
}

export async function joinMarket(userId, marketId, pickedNumber, amount) {
  await rejectBetForUnsettledStaleRound(marketId);

  return prisma.$transaction(async (tx) => {
    const market = await tx.market.findUnique({ where: { id: marketId } });

    if (!market) {
      throw new ApiError(404, 'Market not found', 'MARKET_NOT_FOUND');
    }

    if (!isMarketOpen(market.openTime, market.closeTime)) {
      throw new ApiError(400, 'This market is not open for joining', 'MARKET_NOT_OPEN');
    }

    const minBetAmount = moneyNumber(market.minBetAmount);
    const maxBetAmount = moneyNumber(market.maxBetAmount);
    if (amount < minBetAmount || amount > maxBetAmount) {
      throw new ApiError(
        400,
        `Bet amount must be between ₹${minBetAmount} and ₹${maxBetAmount}`,
        'BET_AMOUNT_OUT_OF_RANGE',
      );
    }
    const betAmount = new Prisma.Decimal(amount).toDecimalPlaces(2);

    try {
      await tx.marketParticipation.create({
        data: {
          marketId,
          roundNumber: market.currentRound,
          userId,
        },
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new ApiError(409, 'You have already bet in this market round', 'ALREADY_JOINED');
      }

      throw error;
    }

    const reserved = await tx.market.updateMany({
      where: {
        id: marketId,
        currentRound: market.currentRound,
        participants: { lt: market.maxParticipants },
      },
      data: { participants: { increment: 1 } },
    });

    if (reserved.count !== 1) {
      throw new ApiError(409, 'This market is full', 'MARKET_FULL');
    }

    const debit = await tx.user.updateMany({
      where: { id: userId, walletBalance: { gte: betAmount } },
      data: { walletBalance: { decrement: betAmount } },
    });

    if (debit.count !== 1) {
      throw new ApiError(400, 'Insufficient wallet balance', 'INSUFFICIENT_BALANCE');
    }

    const entry = await tx.marketEntry.create({
      data: {
        marketId,
        roundNumber: market.currentRound,
        userId,
        amount: betAmount,
        pickedNumber,
      },
    });
    await creditBetCommission(tx, entry);

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    return {
      marketId,
      roundNumber: market.currentRound,
      entryAmount: moneyNumber(betAmount),
      pickedNumber,
      participants: market.participants + 1,
      maxParticipants: market.maxParticipants,
      walletBalance: user.walletBalance.toString(),
    };
  });
}

export function sessionClose(openTime, closeTime, now = new Date(), lastSettledClose = null) {
  const parts = indiaDateTimeParts(now);
  const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);
  const openMinutes = toMinutes(openTime);
  const closeMinutes = toMinutes(closeTime);
  let dateKey = `${parts.year}-${parts.month}-${parts.day}`;

  if (closeTime < openTime && currentMinutes >= openMinutes) {
    dateKey = nextIndiaDate(dateKey);
  } else if (
    closeTime < openTime &&
    currentMinutes > closeMinutes &&
    lastSettledClose &&
    new Date(lastSettledClose).getTime() >=
      new Date(`${dateKey}T${closeTime}:00+05:30`).getTime()
  ) {
    dateKey = nextIndiaDate(dateKey);
  }

  return new Date(`${dateKey}T${closeTime}:00+05:30`);
}

export function isResultDue(market, now = new Date(), roundStartedAt = null) {
  const close = roundStartedAt
    ? sessionCloseForEntry(market.openTime, market.closeTime, roundStartedAt)
    : sessionClose(
        market.openTime,
        market.closeTime,
        now,
        market.lastSettledClose,
      );
  const dueAt = close.getTime() + env.resultDelayMinutes * 60 * 1000;

  if (now.getTime() < dueAt) {
    return false;
  }

  if (market.lastSettledClose && new Date(market.lastSettledClose).getTime() >= close.getTime()) {
    return false;
  }

  return true;
}

/**
 * A two-digit pick must match both result digits. A one-digit pick matches the second digit.
 * @param {number | null | undefined} pickedNumber
 * @param {string} result
 */
export function payoutMultiplier(pickedNumber, result) {
  if (pickedNumber == null || !/^\d{2}$/.test(result)) {
    return 0;
  }

  if (pickedNumber >= 10 && pickedNumber === Number(result)) {
    return TWO_DIGIT_MULTIPLIER;
  }

  if (pickedNumber >= 1 && pickedNumber <= 9 && pickedNumber === Number(result[1])) {
    return ONE_DIGIT_MULTIPLIER;
  }

  return 0;
}

function formatRupees(amount) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

async function notifyDeclaredResult(marketName, result, alerts) {
  await Promise.all(
    alerts.map(async (alert) => {
      const title = alert.payout == null ? 'Result declared' : 'You won';
      const body =
        alert.payout == null
          ? `${marketName} result is ${result}.`
          : `${marketName} result is ${result}. You won ₹${formatRupees(alert.payout)}.`;

      try {
        await notifyUser(alert.userId, title, body);
      } catch (error) {
        console.error('Result notification failed', error);
      }
    }),
  );
}

export async function declareMarketResult(marketId, result, options = {}) {
  const closeAt = options.closeAt ?? null;

  let outcome;
  try {
    outcome = await prisma.$transaction(async (tx) => {
    const market = await tx.market.findUnique({ where: { id: marketId } });

    if (!market) {
      throw new ApiError(404, 'Market not found', 'MARKET_NOT_FOUND');
    }

    if (closeAt) {
      const reserved = await tx.market.updateMany({
        where: {
          id: marketId,
          OR: [{ lastSettledClose: null }, { lastSettledClose: { lt: closeAt } }],
        },
        data: { lastSettledClose: closeAt },
      });

      if (reserved.count !== 1) {
        return null;
      }
    }

    const settledOn = settlementDate();
    const alreadySettledToday = await tx.marketRound.findFirst({
      where: { marketId, settledOn },
      select: { id: true },
    });

    if (alreadySettledToday) {
      throw new ApiError(
        409,
        'A result for this market is already recorded for this date',
        'MARKET_RESULT_EXISTS',
      );
    }

    const entries = await tx.marketEntry.findMany({
      where: { marketId, roundNumber: market.currentRound },
      select: {
        id: true,
        userId: true,
        amount: true,
        pickedNumber: true,
        createdAt: true,
      },
    });
    const firstEntryAt = entries.reduce(
      (first, entry) => (!first || entry.createdAt < first ? entry.createdAt : first),
      null,
    );
    const sessionCloseAt =
      closeAt ??
      (firstEntryAt
        ? sessionCloseForEntry(market.openTime, market.closeTime, firstEntryAt)
        : sessionClose(market.openTime, market.closeTime, new Date(), market.lastSettledClose));
    let winnerCount = 0;
    let totalPayout = new Prisma.Decimal(0);
    let totalBetAmount = new Prisma.Decimal(0);
    const alerts = [];
    const winners = [];

    for (const entry of entries) {
      totalBetAmount = totalBetAmount.add(entry.amount);
      const multiplier = payoutMultiplier(entry.pickedNumber, result);
      const payout = multiplier === 0
        ? null
        : new Prisma.Decimal(entry.amount).mul(multiplier);

      alerts.push({
        userId: entry.userId,
        payout: payout == null ? null : moneyNumber(payout),
      });

      if (payout == null) {
        continue;
      }

      totalPayout = totalPayout.add(payout);
      winnerCount += 1;
      winners.push({
        entryId: entry.id,
        userId: entry.userId,
        payout,
      });
    }

    if (winners.length > 0) {
      await tx.$executeRaw`
        UPDATE users
        SET wallet_balance = CASE id
          ${Prisma.join(
            winners.map(
              (winner) =>
                Prisma.sql`WHEN ${winner.userId} THEN wallet_balance + ${winner.payout}`,
            ),
          )}
          ELSE wallet_balance
        END
        WHERE id IN (${Prisma.join(winners.map((winner) => winner.userId))})
      `;
      await tx.$executeRaw`
        UPDATE market_entries
        SET payout_amount = CASE id
          ${Prisma.join(
            winners.map(
              (winner) => Prisma.sql`WHEN ${winner.entryId} THEN ${winner.payout}`,
            ),
          )}
          ELSE payout_amount
        END
        WHERE id IN (${Prisma.join(winners.map((winner) => winner.entryId))})
      `;
    }

    const participantCount = entries.length;
    await tx.marketRound.create({
      data: {
        marketId,
        roundNumber: market.currentRound,
        result,
        participantCount,
        totalBetAmount,
        settledOn,
        sessionOn: sessionDate(market.openTime, market.closeTime, sessionCloseAt),
      },
    });

    const restarted = await tx.market.update({
      where: { id: marketId },
      data: {
        participants: 0,
        currentRound: { increment: 1 },
        lastResult: result,
        ...(closeAt ? { lastSettledClose: closeAt } : {}),
      },
    });

    return {
      ...toPublicMarket(restarted, { participants: 0, totalBetAmount: 0 }),
      settledRound: market.currentRound,
      participantCount,
      settledBetAmount: moneyNumber(totalBetAmount),
      winnerCount,
      totalPayout: moneyNumber(totalPayout),
      price: options.price ?? null,
      marketName: market.name,
      alerts,
    };
    });
  } catch (error) {
    if (uniqueConstraint(error).includes('settled_on')) {
      throw new ApiError(
        409,
        'A result for this market is already recorded for this date',
        'MARKET_RESULT_EXISTS',
      );
    }

    throw error;
  }

  if (!outcome) {
    return null;
  }

  const { alerts, marketName } = outcome;
  if (options.notify === false) {
    outcome.pendingNotification = { marketName, result, alerts };
  } else {
    void notifyDeclaredResult(marketName, result, alerts);
  }
  delete outcome.alerts;
  delete outcome.marketName;
  return outcome;
}

async function cancelMarketRound(market, closeAt) {
  return prisma.$transaction(async (tx) => {
    const reserved = await tx.market.updateMany({
      where: {
        id: market.id,
        currentRound: market.currentRound,
        OR: [{ lastSettledClose: null }, { lastSettledClose: { lt: closeAt } }],
      },
      data: { lastSettledClose: closeAt },
    });

    if (reserved.count !== 1) {
      return null;
    }

    const entries = await tx.marketEntry.findMany({
      where: { marketId: market.id, roundNumber: market.currentRound },
      select: { userId: true, amount: true },
    });

    if (entries.length === 0) {
      return null;
    }

    const refundByUser = new Map();
    let totalRefund = new Prisma.Decimal(0);
    for (const entry of entries) {
      const amount = new Prisma.Decimal(entry.amount);
      totalRefund = totalRefund.add(amount);
      refundByUser.set(
        entry.userId,
        (refundByUser.get(entry.userId) ?? new Prisma.Decimal(0)).add(amount),
      );
    }

    for (const [userId, amount] of refundByUser) {
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } },
      });
    }

    const commissionGroups = await tx.commissionEntry.groupBy({
      by: ['accountId', 'role', 'marketEntryId'],
      where: {
        marketId: market.id,
        roundNumber: market.currentRound,
        marketEntryId: { not: null },
        accountId: { not: null },
      },
      _sum: { amount: true },
    });

    for (const group of commissionGroups) {
      if (group.accountId && group._sum.amount) {
        await tx.adminAccount.update({
          where: { id: group.accountId },
          data: { commissionBalance: { decrement: group._sum.amount } },
        });
      }
    }

    if (commissionGroups.length > 0) {
      await tx.commissionEntry.createMany({
        data: commissionGroups
          .filter((group) => group.accountId && group.marketEntryId && group._sum.amount)
          .map((group) => ({
            marketId: market.id,
            roundNumber: market.currentRound,
            accountId: group.accountId,
            role: group.role,
            marketEntryId: group.marketEntryId,
            amount: new Prisma.Decimal(group._sum.amount).mul(-1),
          })),
      });
    }
    await tx.marketRound.create({
      data: {
        marketId: market.id,
        roundNumber: market.currentRound,
        result: null,
        status: 'canceled',
        participantCount: entries.length,
        totalBetAmount: totalRefund,
        settledOn: settlementDate(closeAt),
        sessionOn: sessionDate(market.openTime, market.closeTime, closeAt),
      },
    });
    await tx.market.update({
      where: { id: market.id },
      data: {
        participants: 0,
        currentRound: { increment: 1 },
      },
    });

    return {
      marketId: market.id,
      symbol: market.symbol,
      canceledRound: market.currentRound,
      refundedAmount: moneyNumber(totalRefund),
      refundedPlayers: refundByUser.size,
    };
  });
}

export async function settleDueMarkets(now = new Date()) {
  const markets = await prisma.market.findMany();
  if (markets.length === 0) {
    return { settled: [], canceled: [], skipped: [] };
  }

  const currentRoundEntries = await prisma.marketEntry.findMany({
    where: {
      OR: markets.map((market) => ({
        marketId: market.id,
        roundNumber: market.currentRound,
      })),
    },
    orderBy: { createdAt: 'asc' },
    select: { marketId: true, roundNumber: true, createdAt: true },
  });
  const firstEntryByRound = new Map();
  for (const entry of currentRoundEntries) {
    const key = `${entry.marketId}:${entry.roundNumber}`;
    if (!firstEntryByRound.has(key)) {
      firstEntryByRound.set(key, entry);
    }
  }

  const dueBySchedule = markets
    .map((market) => {
      const firstEntry = firstEntryByRound.get(
        `${market.id}:${market.currentRound}`,
      );
      // Markets without bets still get a result for the current session.
      if (!isResultDue(market, now, firstEntry?.createdAt ?? null)) {
        return null;
      }

      return {
        ...market,
        closeAt: firstEntry
          ? sessionCloseForEntry(market.openTime, market.closeTime, firstEntry.createdAt)
          : sessionClose(market.openTime, market.closeTime, now, market.lastSettledClose),
      };
    })
    .filter(Boolean);

  if (dueBySchedule.length === 0) {
    return { settled: [], canceled: [], skipped: [] };
  }

  const dueIds = dueBySchedule.map((market) => market.id);
  const settledToday = await prisma.marketRound.findMany({
    where: {
      marketId: { in: dueIds },
      settledOn: settlementDate(now),
    },
    select: {
      marketId: true,
      roundNumber: true,
      result: true,
      status: true,
    },
  });
  const settledTodayByMarket = new Map(
    settledToday.map((round) => [round.marketId, round]),
  );
  const skipped = dueBySchedule
    .filter((market) => settledTodayByMarket.has(market.id))
    .map((market) => {
      const round = settledTodayByMarket.get(market.id);
      return {
        marketId: market.id,
        symbol: market.symbol,
        reason: 'A result is already recorded for this market today',
        settledRound: round.roundNumber,
        result: round.result,
        status: round.status,
      };
    });
  const dueMarkets = dueBySchedule.filter(
    (market) => !settledTodayByMarket.has(market.id),
  );

  if (dueMarkets.length === 0) {
    return { settled: [], canceled: [], skipped };
  }

  let quotes = [];
  let quoteFailure = null;
  if (dueMarkets.length > 0) {
    if (!env.rapidApiKey) {
      quoteFailure = 'Market result API key is not configured';
    } else {
      try {
        quotes = await fetchMarketQuotes(
          dueMarkets.map((market) => market.symbol),
        );
      } catch (error) {
        quoteFailure = error.message;
        console.error('Market quote fetch failed', error);
      }
    }
  }
  const quotesBySymbol = new Map(
    quotes.map((quote) => [String(quote.symbol ?? '').toUpperCase(), quote]),
  );
  const settled = [];
  const canceled = [];
  const pendingNotifications = [];

  await Promise.all(
    dueMarkets.map(async (market) => {
      const quote = quotesBySymbol.get(market.symbol.toUpperCase());
      if (quoteFailure || !quote || quote.regularMarketPrice == null) {
        const reason =
          quoteFailure ??
          'No regularMarketPrice was returned by the quote provider';
        const cancelAt =
          market.closeAt.getTime() +
          (env.resultDelayMinutes + env.resultWaitMinutes) * 60 * 1000;
        if (now.getTime() < cancelAt) {
          skipped.push({
            marketId: market.id,
            symbol: market.symbol,
            reason: `${reason}; will retry until ${new Date(cancelAt).toISOString()}`,
          });
          return;
        }

        const outcome = await cancelMarketRound(market, market.closeAt);
        if (outcome) {
          canceled.push({ ...outcome, reason });
        } else {
          skipped.push({
            marketId: market.id,
            symbol: market.symbol,
            reason: 'Round was already handled',
          });
        }
        return;
      }

      const result = digitsAfterDecimal(quote.regularMarketPrice);
      let outcome;
      try {
        outcome = await declareMarketResult(market.id, result, {
          closeAt: market.closeAt,
          price: quote.regularMarketPrice,
          notify: false,
        });
      } catch (error) {
        if (!(error instanceof ApiError) || error.code !== 'MARKET_RESULT_EXISTS') {
          throw error;
        }

        skipped.push({
          marketId: market.id,
          symbol: market.symbol,
          reason: error.message,
        });
        return;
      }

      if (!outcome) {
        return;
      }

      if (outcome.pendingNotification) {
        pendingNotifications.push(outcome.pendingNotification);
        delete outcome.pendingNotification;
      }

      settled.push({
        marketId: market.id,
        symbol: market.symbol,
        price: quote.regularMarketPrice,
        result,
        winnerCount: outcome.winnerCount,
        totalPayout: outcome.totalPayout,
      });
    }),
  );

  if (pendingNotifications.length > 0) {
    void Promise.all(
      pendingNotifications.map((notice) =>
        notifyDeclaredResult(notice.marketName, notice.result, notice.alerts),
      ),
    );
  }

  return { settled, canceled, skipped };
}

export async function listResultHistory(from, to, { page, pageSize }) {
  const roundsWithExtra = await prisma.marketRound.findMany({
    where: {
      status: 'settled',
      sessionOn: {
        gte: settlementDate(from),
        lt: settlementDate(to),
      },
    },
    include: {
      market: { select: { name: true, symbol: true } },
    },
    orderBy: [
      { sessionOn: 'desc' },
      { settledAt: 'desc' },
      { roundNumber: 'desc' },
      { marketId: 'desc' },
    ],
    skip: (page - 1) * pageSize,
    take: pageSize + 1,
  });
  const hasMore = roundsWithExtra.length > pageSize;
  const rounds = roundsWithExtra.slice(0, pageSize);

  return {
    items: rounds.map((round) => ({
      id: round.id,
      marketName: round.market.name,
      symbol: round.market.symbol,
      result: round.result,
      roundNumber: round.roundNumber,
      settledAt: round.settledAt,
      sessionOn: indiaDateKey(round.sessionOn),
    })),
    pagination: { page, pageSize, hasMore },
  };
}

export async function getBettingOverview() {
  const [markets, accounts] = await Promise.all([
    listMarketsWithTotals(),
    prisma.adminAccount.findMany({
      select: { role: true, commissionBalance: true },
    }),
  ]);

  const adminShare = moneyNumber(
    accounts.find((account) => account.role === 'admin')?.commissionBalance,
  );
  const subadminShare = moneyNumber(
    accounts.find((account) => account.role === 'subadmin')?.commissionBalance,
  );

  return {
    commissionPercent: env.commissionPercent,
    current: {
      totalBets: markets.reduce((sum, market) => sum + market.participants, 0),
      totalBetAmount: moneyNumber(
        markets.reduce((sum, market) => sum + market.totalBetAmount, 0),
      ),
    },
    commission: {
      total: moneyNumber(adminShare + subadminShare),
      adminShare,
      subadminShare,
    },
    markets,
  };
}
