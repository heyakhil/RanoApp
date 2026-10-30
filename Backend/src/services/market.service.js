import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { listMarketsWithTotals, presentMarket } from './bet.service.js';

const MAX_MARKETS = 5;

function getUniqueConstraint(error) {
  if (error?.code !== 'P2002') return null;

  const target = error.meta?.target;
  return Array.isArray(target) ? target.join(',') : String(target ?? '');
}

export async function listMarkets() {
  return listMarketsWithTotals();
}

export async function getMarket(id) {
  const market = await prisma.market.findUnique({ where: { id } });

  if (!market) {
    throw new ApiError(404, 'Market not found', 'MARKET_NOT_FOUND');
  }

  return presentMarket(market);
}

export async function createMarket(input) {
  const occupiedSlots = await prisma.market.findMany({
    select: { slot: true },
  });
  const occupied = new Set(occupiedSlots.map((market) => market.slot));
  const slot = Array.from({ length: MAX_MARKETS }, (_, index) => index + 1).find(
    (candidate) => !occupied.has(candidate),
  );

  if (slot === undefined) {
    throw new ApiError(409, 'A maximum of five markets is allowed', 'MARKET_LIMIT_REACHED');
  }

  try {
    const market = await prisma.market.create({ data: { ...input, slot } });
    return presentMarket(market);
  } catch (error) {
    const constraint = getUniqueConstraint(error) ?? '';
    if (constraint.includes('symbol')) {
      throw new ApiError(409, 'A market with this symbol already exists', 'DUPLICATE_MARKET_SYMBOL');
    }
    if (constraint.includes('slot')) {
      throw new ApiError(409, 'Market slots were updated concurrently; please retry', 'MARKET_SLOT_CONFLICT');
    }

    throw error;
  }
}

export async function updateMarket(id, input) {
  const currentMarket = await prisma.market.findUnique({ where: { id } });
  if (!currentMarket) {
    throw new ApiError(404, 'Market not found', 'MARKET_NOT_FOUND');
  }
  const nextMinBetAmount = input.minBetAmount ?? Number(currentMarket.minBetAmount);
  const nextMaxBetAmount = input.maxBetAmount ?? Number(currentMarket.maxBetAmount);
  if (nextMinBetAmount > nextMaxBetAmount) {
    throw new ApiError(
      400,
      'Maximum bet amount must be greater than or equal to the minimum',
      'INVALID_BET_RANGE',
    );
  }

  if (input.openTime !== undefined || input.countryCode !== undefined) {
    const activeBets = await prisma.marketEntry.count({
      where: { marketId: id, roundNumber: currentMarket.currentRound },
    });
    if (activeBets > 0) {
      throw new ApiError(409, 'Wait for the current round to settle before changing market schedule', 'MARKET_ROUND_ACTIVE');
    }
  }

  try {
    const market = await prisma.market.update({
      where: { id },
      data: {
        ...input,
        ...(input.openTime !== undefined || input.countryCode !== undefined
          ? { sessionOpenAt: null, sessionCloseAt: null, lastCloseFetchAt: null, closeTime: null }
          : {}),
      },
    });
    return presentMarket(market);
  } catch (error) {
    if ((getUniqueConstraint(error) ?? '').includes('symbol')) {
      throw new ApiError(409, 'A market with this symbol already exists', 'DUPLICATE_MARKET_SYMBOL');
    }

    throw error;
  }
}

export async function deleteMarket(id) {
  const market = await prisma.market.findUnique({ where: { id }, select: { id: true } });
  if (!market) {
    throw new ApiError(404, 'Market not found', 'MARKET_NOT_FOUND');
  }
  await prisma.market.delete({ where: { id } });
}
