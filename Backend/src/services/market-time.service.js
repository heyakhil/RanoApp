import { prisma } from '../config/prisma.js';

const indiaClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** @param {Date} at */
function indiaParts(at) {
  return Object.fromEntries(indiaClock.formatToParts(at)
    .filter(({ type }) => type !== 'literal')
    .map(({ type, value }) => [type, value]));
}

/** @param {Date} at @returns {string} */
function indiaDay(at) {
  const { year, month, day } = indiaParts(at);
  return `${year}-${month}-${day}`;
}

/** @param {string} day @param {string} openTime @param {string | null} closeTime */
export function sessionTimes(day, openTime, closeTime) {
  if (!closeTime) return null;
  const openAt = new Date(`${day}T${openTime}:00+05:30`);
  const closeAt = new Date(`${day}T${closeTime}:00+05:30`);
  if (closeAt <= openAt) closeAt.setUTCDate(closeAt.getUTCDate() + 1);
  return { openAt, closeAt };
}

/**
 * @param {{sessionOpenAt: Date | null, sessionCloseAt: Date | null,
 *   lastSettledClose: Date | null}} market
 * @param {{openAt: Date, closeAt: Date}} times
 * @param {Date} now
 * @returns {boolean}
 */
export function shouldOpenSession(market, times, now) {
  if (now < times.openAt || indiaDay(market.sessionOpenAt ?? new Date(0)) === indiaDay(now)) {
    return false;
  }
  return !market.sessionCloseAt ||
    Boolean(market.lastSettledClose && market.lastSettledClose >= market.sessionCloseAt);
}

/** @param {Date} now */
export async function syncOpenedMarketSessions(now = new Date()) {
  const today = indiaDay(now);
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  if (weekday === 0 || weekday === 6) return { synced: [], skipped: [] };

  const markets = await prisma.market.findMany();
  const synced = [];
  const skipped = [];
  for (const market of markets) {
    const times = sessionTimes(today, market.openTime, market.closeTime);
    if (!times) {
      skipped.push({ marketId: market.id, reason: 'Set a close time in the admin panel' });
      continue;
    }
    if (!shouldOpenSession(market, times, now)) continue;

    const updated = await prisma.market.updateMany({
      where: { id: market.id, openTime: market.openTime, closeTime: market.closeTime,
        sessionOpenAt: market.sessionOpenAt, sessionCloseAt: market.sessionCloseAt,
        lastSettledClose: market.lastSettledClose },
      data: { sessionOpenAt: times.openAt, sessionCloseAt: times.closeAt,
        quoteFetchAttempts: 0, lastQuoteFetchAt: null,
        pendingCloseCents: null, pendingCloseSeenAt: null },
    });
    if (updated.count) synced.push({ marketId: market.id, closeAt: times.closeAt });
  }
  return { synced, skipped };
}
