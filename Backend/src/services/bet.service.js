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
  const current = now.getHours() * 60 + now.getMinutes();
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

export function splitCommission(totalBetAmount) {
  const totalPaise = Math.round(Number(totalBetAmount) * 100);
  const commissionPaise = Math.round((totalPaise * env.commissionPercent) / 100);
  const adminPaise = Math.floor(commissionPaise / 2);

  return {
    commissionAmount: commissionPaise / 100,
    adminShare: adminPaise / 100,
    subadminShare: (commissionPaise - adminPaise) / 100,
  };
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
    entryAmount: moneyNumber(market.entryAmount),
    totalBetAmount: totals?.totalBetAmount ?? moneyNumber(market.entryAmount) * participants,
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
    const participants = isCurrentRound
      ? liveCount?._count._all ?? 0
      : settled?.participantCount ?? liveCount?._count._all ?? 0;

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
      isCurrentRound,
      createdAt: entry.createdAt,
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

  const entries = await prisma.marketEntry.findMany({
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

export async function joinMarket(userId, marketId, pickedNumber) {
  return prisma.$transaction(async (tx) => {
    const market = await tx.market.findUnique({ where: { id: marketId } });

    if (!market) {
      throw new ApiError(404, 'Market not found', 'MARKET_NOT_FOUND');
    }

    if (!isMarketOpen(market.openTime, market.closeTime)) {
      throw new ApiError(400, 'This market is not open for joining', 'MARKET_NOT_OPEN');
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
      where: { id: userId, walletBalance: { gte: market.entryAmount } },
      data: { walletBalance: { decrement: market.entryAmount } },
    });

    if (debit.count !== 1) {
      throw new ApiError(400, 'Insufficient wallet balance', 'INSUFFICIENT_BALANCE');
    }

    try {
      await tx.marketEntry.create({
        data: {
          marketId,
          roundNumber: market.currentRound,
          userId,
          amount: market.entryAmount,
          pickedNumber,
        },
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new ApiError(409, 'You have already joined this market', 'ALREADY_JOINED');
      }

      throw error;
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    return {
      marketId,
      roundNumber: market.currentRound,
      entryAmount: moneyNumber(market.entryAmount),
      pickedNumber,
      participants: market.participants + 1,
      maxParticipants: market.maxParticipants,
      walletBalance: user.walletBalance.toString(),
    };
  });
}

export function sessionClose(openTime, closeTime, now = new Date(), lastSettledClose = null) {
  const [hours, minutes] = closeTime.split(':').map(Number);
  const close = new Date(now);
  close.setHours(hours, minutes, 0, 0);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = Number(openTime.slice(0, 2)) * 60 + Number(openTime.slice(3));
  const closeMinutes = hours * 60 + minutes;

  if (closeTime < openTime && currentMinutes >= openMinutes) {
    close.setDate(close.getDate() + 1);
  } else if (
    closeTime < openTime &&
    currentMinutes > closeMinutes &&
    lastSettledClose &&
    new Date(lastSettledClose).getTime() >= close.getTime()
  ) {
    close.setDate(close.getDate() + 1);
  }

  return close;
}

export function isResultDue(market, now = new Date()) {
  const close = sessionClose(
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
    });
    let winnerCount = 0;
    let totalPayout = new Prisma.Decimal(0);
    const alerts = [];

    for (const entry of entries) {
      const multiplier = payoutMultiplier(entry.pickedNumber, result);
      alerts.push({
        userId: entry.userId,
        payout: null,
      });

      if (multiplier === 0) {
        continue;
      }

      const payout = new Prisma.Decimal(entry.amount).mul(multiplier);
      totalPayout = totalPayout.add(payout);
      winnerCount += 1;
      alerts[alerts.length - 1].payout = moneyNumber(payout);

      await tx.user.update({
        where: { id: entry.userId },
        data: { walletBalance: { increment: payout } },
      });
      await tx.marketEntry.update({
        where: { id: entry.id },
        data: { payoutAmount: payout },
      });
    }

    const aggregate = await tx.marketEntry.aggregate({
      where: { marketId, roundNumber: market.currentRound },
      _sum: { amount: true },
      _count: { _all: true },
    });
    const participantCount = aggregate._count._all;
    const totalBetAmount = aggregate._sum.amount ?? 0;
    const shares = splitCommission(totalBetAmount);

    await tx.marketRound.create({
      data: {
        marketId,
        roundNumber: market.currentRound,
        result,
        participantCount,
        totalBetAmount,
        commissionAmount: shares.commissionAmount,
        adminShare: shares.adminShare,
        subadminShare: shares.subadminShare,
        settledOn,
      },
    });

    const commissionRows = [
      { role: 'admin', amount: shares.adminShare },
      { role: 'subadmin', amount: shares.subadminShare },
    ].filter((row) => row.amount > 0);

    if (commissionRows.length > 0) {
      await tx.commissionEntry.createMany({
        data: commissionRows.map((row) => ({
          marketId,
          roundNumber: market.currentRound,
          role: row.role,
          amount: row.amount,
        })),
      });
    }

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
      ...shares,
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
  await notifyDeclaredResult(marketName, result, alerts);
  delete outcome.alerts;
  delete outcome.marketName;
  return outcome;
}

export async function settleDueMarkets(now = new Date()) {
  if (!env.rapidApiKey) {
    throw new ApiError(
      503,
      'Market result API key is not configured',
      'RESULT_API_NOT_CONFIGURED',
    );
  }

  const markets = await prisma.market.findMany();
  const dueMarkets = markets.filter((market) => isResultDue(market, now));

  if (dueMarkets.length === 0) {
    return { settled: [], skipped: [] };
  }

  const quotes = await fetchMarketQuotes(dueMarkets.map((market) => market.symbol));
  const quotesBySymbol = new Map(
    quotes.map((quote) => [String(quote.symbol ?? '').toUpperCase(), quote]),
  );
  const settled = [];
  const skipped = [];

  for (const market of dueMarkets) {
    const quote = quotesBySymbol.get(market.symbol.toUpperCase());
    if (!quote || quote.regularMarketPrice == null) {
      console.error(`No regularMarketPrice for ${market.symbol}`);
      skipped.push({
        marketId: market.id,
        symbol: market.symbol,
        reason: 'No regularMarketPrice was returned by the quote provider',
      });
      continue;
    }

    const result = digitsAfterDecimal(quote.regularMarketPrice);
    let outcome;
    try {
      outcome = await declareMarketResult(market.id, result, {
        closeAt: sessionClose(
          market.openTime,
          market.closeTime,
          now,
          market.lastSettledClose,
        ),
        price: quote.regularMarketPrice,
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
      continue;
    }

    if (outcome) {
      settled.push({
        marketId: market.id,
        symbol: market.symbol,
        price: quote.regularMarketPrice,
        result,
        winnerCount: outcome.winnerCount,
        totalPayout: outcome.totalPayout,
      });
    }
  }

  return { settled, skipped };
}

function shareAmount(groups, role) {
  const match = groups.find((group) => group.role === role);
  return moneyNumber(match?._sum.amount);
}

export async function listResultHistory(from, to, { page, pageSize }) {
  const roundsWithExtra = await prisma.marketRound.findMany({
    where: {
      settledAt: {
        gte: from,
        lt: to,
      },
    },
    include: {
      market: { select: { name: true, symbol: true } },
    },
    orderBy: [
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
    })),
    pagination: { page, pageSize, hasMore },
  };
}

export async function getBettingOverview() {
  const [markets, commissionGroups] = await Promise.all([
    listMarketsWithTotals(),
    prisma.commissionEntry.groupBy({
      by: ['role'],
      _sum: { amount: true },
    }),
  ]);

  const adminShare = shareAmount(commissionGroups, 'admin');
  const subadminShare = shareAmount(commissionGroups, 'subadmin');

  return {
    commissionPercent: env.commissionPercent,
    current: {
      joinedUsers: markets.reduce((sum, market) => sum + market.participants, 0),
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
