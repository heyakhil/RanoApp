import assert from 'node:assert/strict';
import test from 'node:test';

process.env.DATABASE_URL ??= 'mysql://test:test@127.0.0.1:3306/test';
process.env.JWT_SECRET ??= 'test-secret';
process.env.RESULT_DELAY_MINUTES = '5';
const { scheduledResultAt, isResultDue, canPlaceBet, toPublicMarket,
  shouldFetchQuote, isClosedMarketState, isQuoteFromClosingSession } =
  await import('./bet.service.js');
const { parseMarketClose, shouldFetchMarketTime, syncOpenedMarketSessions } =
  await import('./market-time.service.js');

test('reads the German market close from the supplied API response', () => {
  const response = { finance: { marketTimes: [{ marketTime: [{
    id: 'de', close: '2026-10-30T16:30:00Z', time: '2026-10-30T17:58:15Z',
  }] }] } };
  assert.equal(parseMarketClose(response, 'DE').toISOString(), '2026-10-30T16:30:00.000Z');
});

test('makes at most one market-time fetch per India day', () => {
  const attemptedAt = new Date('2026-10-30T04:00:00Z');
  assert.equal(shouldFetchMarketTime(null, attemptedAt), true);
  assert.equal(shouldFetchMarketTime(attemptedAt, new Date('2026-10-30T12:00:00Z')), false);
  assert.equal(shouldFetchMarketTime(attemptedAt, new Date('2026-10-30T18:30:00Z')), true);
});

test('does not request stock-market close times on weekends', async () => {
  assert.deepEqual(
    await syncOpenedMarketSessions(new Date('2026-10-31T08:00:00Z')),
    { synced: [], skipped: [] },
  );
});

test('result is due five minutes after the API close, with no fixed 10 PM gate', () => {
  const market = {
    sessionOpenAt: new Date('2026-10-30T04:00:00Z'),
    sessionCloseAt: new Date('2026-10-30T10:00:00Z'),
    lastSettledClose: null,
  };
  const dueAt = scheduledResultAt(market);
  assert.equal(dueAt.toISOString(), '2026-10-30T10:05:00.000Z');
  assert.equal(isResultDue(market, new Date(dueAt.getTime() - 1)), false);
  assert.equal(isResultDue(market, dueAt), false);
  assert.equal(isResultDue(market, new Date(dueAt.getTime() + 1)), true);
});

test('the supplied German API close becomes 10:05 PM IST with a five-minute delay', () => {
  const market = {
    sessionOpenAt: new Date('2026-10-30T12:00:00Z'),
    sessionCloseAt: new Date('2026-10-30T16:30:00Z'),
    lastSettledClose: null,
  };
  assert.equal(scheduledResultAt(market).toISOString(), '2026-10-30T16:35:00.000Z');
});

test('the saved API close is shown and used without a separate verification flag', () => {
  const market = {
    id: 'market-1', name: 'Market', symbol: 'TEST', openTime: '09:00',
    closeTime: '22:00', countryCode: 'IN', maxParticipants: 10,
    participants: 0, minBetAmount: 10, maxBetAmount: 100,
    currentRound: 1, lastResult: null,
    sessionOpenAt: new Date('2026-10-30T04:00:00Z'),
    sessionCloseAt: new Date('2026-10-30T16:30:00Z'),
    lastSettledClose: null,
  };
  const now = new Date('2026-10-30T07:30:00Z');
  assert.equal(toPublicMarket(market).closeTime, '22:00');
  assert.equal(canPlaceBet(market, now), true);
  assert.equal(isResultDue(market, new Date('2026-10-30T16:35:00Z')), false);
  assert.equal(isResultDue(market, new Date('2026-10-30T16:35:01Z')), true);
});

test('rechecking an open market does not change its close or reopen betting', () => {
  const originalClose = new Date('2026-11-02T06:00:00Z');
  const bettingClosesAt = new Date('2026-11-02T05:45:00Z');
  const firstCheck = new Date('2026-11-02T06:05:30Z');
  const market = {
    sessionOpenAt: new Date('2026-11-02T03:45:00Z'),
    sessionCloseAt: originalClose,
    closeTime: '11:30',
    lastQuoteFetchAt: firstCheck,
    lastSettledClose: null,
  };
  assert.equal(canPlaceBet(market, new Date('2026-11-02T06:10:00Z')), false);
  assert.equal(toPublicMarket(market).bettingClosesAt.toISOString(), bettingClosesAt.toISOString());
  assert.equal(toPublicMarket(market).closeTime, '11:30');
  assert.equal(isResultDue(market, firstCheck), true);
  assert.equal(shouldFetchQuote(market, new Date('2026-11-02T06:20:29Z')), false);
  assert.equal(shouldFetchQuote(market, new Date('2026-11-02T06:20:30Z')), true);
});

test('checks quote market state every fifteen minutes without a two-attempt limit', () => {
  const lastQuoteFetchAt = new Date('2026-11-02T06:05:30Z');
  assert.equal(shouldFetchQuote({ quoteFetchAttempts: 3, lastQuoteFetchAt },
    new Date('2026-11-02T06:20:29Z')), false);
  assert.equal(shouldFetchQuote({ quoteFetchAttempts: 3, lastQuoteFetchAt },
    new Date('2026-11-02T06:20:30Z')), true);
  assert.equal(isClosedMarketState('REGULAR'), false);
  assert.equal(isClosedMarketState('POST'), true);
  assert.equal(isClosedMarketState('CLOSED'), true);
  assert.equal(isClosedMarketState(undefined), false);
});

test('requires a quote from the closing session before settling', () => {
  const market = {
    sessionOpenAt: new Date('2026-11-02T03:45:00Z'),
    sessionCloseAt: new Date('2026-11-02T06:00:00Z'),
  };
  const now = new Date('2026-11-02T06:25:00Z');
  assert.equal(isQuoteFromClosingSession({ regularMarketTime: 1793600420 }, market, now), true);
  assert.equal(isQuoteFromClosingSession({ regularMarketTime: 1793599000 }, market, now), false);
  assert.equal(isQuoteFromClosingSession({ regularMarketTime: null }, market, now), false);
  assert.equal(isQuoteFromClosingSession({ regularMarketTime: 1793601140 },
    market, new Date('2026-11-02T07:05:00Z')), true);
});
