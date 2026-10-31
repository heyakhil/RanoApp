import assert from 'node:assert/strict';
import test from 'node:test';

process.env.DATABASE_URL ??= 'mysql://test:test@127.0.0.1:3306/test';
process.env.JWT_SECRET ??= 'test-secret';
process.env.RESULT_DELAY_MINUTES = '5';
const { scheduledResultAt, isResultDue, canPlaceBet, toPublicMarket } = await import('./bet.service.js');
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
