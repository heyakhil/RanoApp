import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

const indiaClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function parts(at) {
  return Object.fromEntries(indiaClock.formatToParts(at)
    .filter((part) => part.type !== 'literal')
    .map((part) => [part.type, part.value]));
}

export function shouldFetchMarketTime(lastAttempt, now) {
  if (!lastAttempt) return true;
  const previous = parts(lastAttempt);
  const current = parts(now);
  return `${previous.year}-${previous.month}-${previous.day}` !==
    `${current.year}-${current.month}-${current.day}`;
}

function parseInstant(value) {
  if (value == null || value === '') return null;
  if (value && typeof value === 'object') {
    return parseInstant(value.raw ?? value.timestamp ?? value.iso);
  }
  const numeric = typeof value === 'number' ? value : null;
  if (numeric == null && (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(value))) return null;
  const date = numeric == null ? new Date(value) : new Date(numeric < 1e12 ? numeric * 1000 : numeric);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function parseMarketClose(body, countryCode) {
  const yahooMarkets = (body?.data ?? body)?.finance?.marketTimes;
  if (Array.isArray(yahooMarkets)) {
    const times = yahooMarkets.flatMap((market) => market.marketTime ?? []);
    const countryTime = times.find((time) =>
      String(time.id ?? '').toUpperCase().startsWith(countryCode));
    return parseInstant(countryTime?.close);
  }
  const root = body?.marketTimeResponse ?? body?.marketTime ?? body?.data ?? body;
  const records = Array.isArray(root) ? root : Array.isArray(root?.result) ? root.result : [root];
  const record = records.find((item) =>
    String(item?.country ?? item?.countryCode ?? item?.region ?? countryCode).toUpperCase() === countryCode);
  if (!record || typeof record !== 'object') return null;
  for (const value of [record.closeTime, record.marketClose, record.close, record.regularMarketClose,
    record.marketCloseTime, record.currentTradingPeriod?.regular?.end]) {
    const date = parseInstant(value);
    if (date) return date;
  }
  return null;
}

export async function fetchMarketClose(countryCode) {
  if (!env.rapidApiKey) throw new Error('RAPIDAPI_KEY is not configured');
  const url = new URL(env.yahooMarketTimeUrl);
  url.searchParams.set('region', countryCode);
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'X-RapidAPI-Key': env.rapidApiKey,
      'X-RapidAPI-Host': env.rapidApiHost },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Market time API returned ${response.status}`);
  const closeAt = parseMarketClose(await response.json(), countryCode);
  if (!closeAt) throw new Error(`Market time API did not return a close timestamp for ${countryCode}`);
  return closeAt;
}

export async function syncOpenedMarketSessions(now = new Date()) {
  const markets = await prisma.market.findMany();
  const current = parts(now);
  const today = `${current.year}-${current.month}-${current.day}`;
  const currentClock = `${current.hour}:${current.minute}`;
  const needsVerification = (market) => Boolean(
    market.sessionCloseAt && !market.sessionCloseVerified &&
    (!market.lastSettledClose || market.lastSettledClose < market.sessionCloseAt),
  );
  const due = markets.filter((market) => {
    if (needsVerification(market)) {
      return market.sessionOpenAt && now >= market.sessionOpenAt &&
        now.getTime() - market.sessionOpenAt.getTime() < 24 * 60 * 60 * 1000 &&
        shouldFetchMarketTime(market.closeVerificationAttemptAt, now);
    }
    if (market.openTime > currentClock) return false;
    // One market-time request per market per India day keeps Basic-plan usage bounded.
    if (!shouldFetchMarketTime(market.lastCloseFetchAt, now)) return false;
    if (market.sessionOpenAt && parts(market.sessionOpenAt).year + '-' +
      parts(market.sessionOpenAt).month + '-' + parts(market.sessionOpenAt).day === today) return false;
    // Never replace an unsettled session's close timestamp.
    if (market.sessionCloseAt && (!market.lastSettledClose || market.lastSettledClose < market.sessionCloseAt)) return false;
    return true;
  });
  const reserved = await Promise.all(due.map(async (market) => {
    const result = await prisma.market.updateMany({
      where: { id: market.id, lastCloseFetchAt: market.lastCloseFetchAt },
      data: { lastCloseFetchAt: now,
        ...(needsVerification(market) ? { closeVerificationAttemptAt: now } : {}) },
    });
    return result.count ? market : null;
  }));
  const claimed = reserved.filter(Boolean);
  const closeByCountry = new Map();
  const errorsByCountry = new Map();
  await Promise.all([...new Set(claimed.map((market) => market.countryCode))].map(async (country) => {
    try { closeByCountry.set(country, await fetchMarketClose(country)); }
    catch (error) {
      errorsByCountry.set(country, error.message);
      console.error(`Market time fetch failed for ${country}`, error);
    }
  }));
  const synced = [];
  const skipped = [];
  for (const market of claimed) {
    const closeAt = closeByCountry.get(market.countryCode);
    const openAt = needsVerification(market)
      ? market.sessionOpenAt
      : new Date(`${today}T${market.openTime}:00+05:30`);
    if (!closeAt || closeAt <= openAt || closeAt.getTime() - openAt.getTime() > 24 * 60 * 60 * 1000) {
      skipped.push({ marketId: market.id,
        reason: errorsByCountry.get(market.countryCode) ?? 'Market time API returned no close for this session' });
      continue;
    }
    const closeParts = parts(closeAt);
    const updated = await prisma.market.updateMany({
      where: { id: market.id, openTime: market.openTime, countryCode: market.countryCode,
        lastCloseFetchAt: now, sessionOpenAt: market.sessionOpenAt,
        sessionCloseAt: market.sessionCloseAt },
      data: { sessionOpenAt: openAt, sessionCloseAt: closeAt,
        sessionCloseVerified: true,
        closeTime: `${closeParts.hour}:${closeParts.minute}`,
        quoteFetchAttempts: 0, lastQuoteFetchAt: null },
    });
    if (updated.count) synced.push({ marketId: market.id, closeAt });
  }
  return { synced, skipped };
}
