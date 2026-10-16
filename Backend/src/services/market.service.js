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
  const nextOpenTime = input.openTime ?? currentMarket.openTime;
  const nextCloseTime = input.closeTime ?? currentMarket.closeTime;
  if (nextOpenTime === nextCloseTime) {
    throw new ApiError(
      400,
      'Close time must differ from open time. An earlier close time is the next day.',
      'INVALID_MARKET_HOURS',
    );
  }

  try {
    const market = await prisma.market.update({
      where: { id },
      data: input,
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
