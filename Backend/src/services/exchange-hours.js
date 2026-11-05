const exchangeCloses = {
  KR: { timeZone: 'Asia/Seoul', hour: 15, minute: 30 },
  DE: { timeZone: 'Europe/Berlin', hour: 18, minute: 0 },
};

/**
 * @param {Date} at
 * @param {string} timeZone
 * @returns {{year: number, month: number, day: number, hour: number, minute: number, second: number}}
 */
function localParts(at, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(at);
  return Object.fromEntries(parts
    .filter(({ type }) => type !== 'literal')
    .map(({ type, value }) => [type, Number(value)]));
}

/**
 * @param {string} countryCode
 * @param {Date | null | undefined} sessionOpenAt
 * @returns {Date | null}
 */
export function minimumMarketClose(countryCode, sessionOpenAt) {
  const exchange = exchangeCloses[countryCode];
  if (!exchange || !sessionOpenAt) return null;

  const opened = localParts(sessionOpenAt, exchange.timeZone);
  const localClose = Date.UTC(opened.year, opened.month - 1, opened.day,
    exchange.hour, exchange.minute);
  const probe = new Date(Date.UTC(opened.year, opened.month - 1, opened.day, 12));
  const zone = localParts(probe, exchange.timeZone);
  const offset = Date.UTC(zone.year, zone.month - 1, zone.day,
    zone.hour, zone.minute, zone.second) - probe.getTime();
  return new Date(localClose - offset);
}
