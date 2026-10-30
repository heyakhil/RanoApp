import assert from 'node:assert/strict';
import test from 'node:test';

process.env.DATABASE_URL ??= 'mysql://test:test@127.0.0.1:3306/test';
process.env.JWT_SECRET ??= 'test-secret';
process.env.RESULT_DELAY_MINUTES = '5';
const { scheduledResultAt, isResultDue } = await import('./bet.service.js');
const { parseMarketClose } = await import('./market-time.service.js');

test('reads the German market close from the supplied API response', () => {
  const response = { finance: { marketTimes: [{ marketTime: [{
    id: 'de', close: '2026-10-30T16:30:00Z', time: '2026-10-30T17:58:15Z',
  }] }] } };
  assert.equal(parseMarketClose(response, 'DE').toISOString(), '2026-10-30T16:30:00.000Z');
});

test('result is due five minutes after the API close, with no fixed 10 PM gate', () => {
  const market = {
    sessionOpenAt: new Date('2026-10-30T04:00:00Z'),
    sessionCloseAt: new Date('2026-10-30T10:00:00Z'),
    sessionCloseVerified: true,
    lastSettledClose: null,
  };
  const dueAt = scheduledResultAt(market);
  assert.equal(dueAt.toISOString(), '2026-10-30T10:05:00.000Z');
  assert.equal(isResultDue(market, new Date(dueAt.getTime() - 1)), false);
  assert.equal(isResultDue(market, dueAt), true);
});

test('the supplied German API close becomes 10:05 PM IST with a five-minute delay', () => {
  const market = {
    sessionOpenAt: new Date('2026-10-30T12:00:00Z'),
    sessionCloseAt: new Date('2026-10-30T16:30:00Z'),
    sessionCloseVerified: true,
    lastSettledClose: null,
  };
  assert.equal(scheduledResultAt(market).toISOString(), '2026-10-30T16:35:00.000Z');
});

test('a carried-over manual close cannot settle before API verification', () => {
  const market = {
    sessionOpenAt: new Date('2026-10-30T04:00:00Z'),
    sessionCloseAt: new Date('2026-10-30T10:00:00Z'),
    sessionCloseVerified: false,
    lastSettledClose: null,
  };
  assert.equal(isResultDue(market, new Date('2026-10-30T20:00:00Z')), false);
});
