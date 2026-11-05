import assert from 'node:assert/strict';
import test from 'node:test';

process.env.DATABASE_URL ??= 'mysql://test:test@127.0.0.1:3306/test';
process.env.JWT_SECRET ??= 'test-secret';
process.env.RESULT_DELAY_MINUTES = '5';
const { scheduledResultAt, isResultDue, canPlaceBet, toPublicMarket,
  shouldFetchQuote, isQuoteFromClosingSession } =
  await import('./bet.service.js');
const { sessionTimes, syncOpenedMarketSessions } =
  await import('./market-time.service.js');
const { fetchMarketQuotes, parseYahooQuotePage, parseYahooHistoryPage } =
  await import('./quote.service.js');
const { minimumMarketClose } = await import('./exchange-hours.js');

test('admin times create an IST session and support an overnight close', () => {
  assert.equal(sessionTimes('2026-11-02', '09:15', '15:30').closeAt.toISOString(),
    '2026-11-02T10:00:00.000Z');
  assert.equal(sessionTimes('2026-11-02', '22:00', '02:00').closeAt.toISOString(),
    '2026-11-02T20:30:00.000Z');
});

test('does not start market sessions on weekends', async () => {
  assert.deepEqual(
    await syncOpenedMarketSessions(new Date('2026-10-31T08:00:00Z')),
    { synced: [], skipped: [] },
  );
});

test('result is due five minutes after the configured close', () => {
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

test('the configured German close gets a five-minute result delay', () => {
  const market = {
    sessionOpenAt: new Date('2026-10-30T12:00:00Z'),
    sessionCloseAt: new Date('2026-10-30T16:30:00Z'),
    lastSettledClose: null,
  };
  assert.equal(scheduledResultAt(market).toISOString(), '2026-10-30T16:35:00.000Z');
});

test('the saved admin close is shown and used', () => {
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
  const firstCheck = new Date('2026-11-02T06:05:30Z');
  const market = {
    sessionOpenAt: new Date('2026-11-02T03:45:00Z'),
    sessionCloseAt: originalClose,
    closeTime: '11:30',
    lastQuoteFetchAt: firstCheck,
    lastSettledClose: null,
  };
  assert.equal(canPlaceBet(market, new Date('2026-11-02T05:47:00Z')), true);
  assert.equal(canPlaceBet(market, originalClose), false);
  assert.equal(toPublicMarket(market).bettingClosesAt.toISOString(), originalClose.toISOString());
  assert.equal(toPublicMarket(market).closeTime, '11:30');
  assert.equal(isResultDue(market, firstCheck), true);
  assert.equal(shouldFetchQuote(market, new Date('2026-11-02T06:20:29Z')), false);
  assert.equal(shouldFetchQuote(market, new Date('2026-11-02T06:20:30Z')), true);
});

test('limits quote page requests to four attempts per IST day', () => {
  const lastQuoteFetchAt = new Date('2026-11-02T06:05:30Z');
  assert.equal(shouldFetchQuote({ quoteFetchAttempts: 1, lastQuoteFetchAt },
    new Date('2026-11-02T06:20:29Z')), false);
  assert.equal(shouldFetchQuote({ quoteFetchAttempts: 1, lastQuoteFetchAt },
    new Date('2026-11-02T06:20:30Z')), true);
  assert.equal(shouldFetchQuote({ quoteFetchAttempts: 4, lastQuoteFetchAt },
    new Date('2026-11-02T07:05:30Z')), false);
  assert.equal(shouldFetchQuote({ quoteFetchAttempts: 4, lastQuoteFetchAt },
    new Date('2026-11-03T07:05:30Z')), true);
  assert.equal(shouldFetchQuote({ quoteFetchAttempts: 181, lastQuoteFetchAt },
    new Date('2026-11-02T07:05:30Z')), true);
});

function quoteHtml(symbol, price, notice) {
  return `<div data-testid="quote-title"><h1>Index (${symbol})</h1></div>
    <section data-testid="quote-price"><span data-testid="qsp-price">${price}</span>
    <div slot="marketTimeNotice"><span class="marketTimeNotice">${notice}</span></div></section>
    <button>U.S. markets closed</button>`;
}

function historyHtml(symbol, date, price) {
  return `<div data-testid="quote-title"><h1>Index (${symbol})</h1></div>
    <table><thead><tr><th>Date</th><th>Open</th><th>High</th><th>Low</th>
    <th>Close</th></tr></thead><tbody><tr><td>${date}</td><td>1</td>
    <td>1</td><td>1</td><td>${price}</td></tr></tbody></table>`;
}

test('recognizes the live open and closed quote notices for the requested index', () => {
  const open = quoteHtml('^KS11', '5,415.33', 'As of 1:25:50 PM GMT+9. Market Open.');
  const closed = quoteHtml('^DJI', '53,356.12', 'At close: 4:51:20 PM EST');
  assert.deepEqual(parseYahooQuotePage(open, '^KS11'), {
    symbol: '^KS11', regularMarketPrice: 5415.33, marketState: 'REGULAR',
  });
  assert.deepEqual(parseYahooQuotePage(closed, '^DJI'), {
    symbol: '^DJI', regularMarketPrice: 53356.12, marketState: 'CLOSED',
  });
  assert.equal(parseYahooQuotePage(open, '^DJI'), null);
  assert.equal(parseYahooQuotePage(quoteHtml('^KS11', '5,415.33', 'Unknown'), '^KS11'), null);
});

test('reads the dated close from the symbol history page', () => {
  assert.deepEqual(parseYahooHistoryPage(historyHtml('^DJI', 'Nov 4, 2026', '53,356.12'), '^DJI'),
    { sessionDate: '2026-11-04', regularMarketPrice: 53356.12 });
  assert.equal(parseYahooHistoryPage(historyHtml('^DJI', 'Nov 4, 2026', '53,356.12'), '^KS11'),
    null);
  const older = historyHtml('^DJI', 'Nov 5, 2026', '53,500.00')
    .replace('</tbody>', '<tr><td>Nov 4, 2026</td><td>1</td><td>1</td><td>1</td><td>53,356.12</td></tr></tbody>');
  assert.deepEqual(parseYahooHistoryPage(older, '^DJI', '2026-11-04'),
    { sessionDate: '2026-11-04', regularMarketPrice: 53356.12 });
});

test('fetches only the quote page while Yahoo says the index is open', async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return new Response(quoteHtml('^KS11', '5,415.33',
      'As of 1:25:50 PM GMT+9. Market Open.'));
  };
  try {
    const { quotes } = await fetchMarketQuotes([{
      symbol: '^KS11', sessionDate: '2026-11-04', historicalOnly: false,
    }]);
    assert.deepEqual(urls, ['https://finance.yahoo.com/quote/%5EKS11/']);
    assert.equal(quotes[0].marketState, 'REGULAR');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('checks the dated history page only after a closed quote', async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return new Response(url.endsWith('/history/')
      ? historyHtml('^DJI', 'Nov 4, 2026', '53,356.12')
      : quoteHtml('^DJI', '53,356.12', 'At close: 4:51:20 PM EST'));
  };
  try {
    const { quotes } = await fetchMarketQuotes([{
      symbol: '^DJI', sessionDate: '2026-11-04', historicalOnly: false,
    }]);
    assert.deepEqual(quotes, [{ symbol: '^DJI',
      regularMarketPrice: 53356.12, marketState: 'CLOSED', sessionDate: '2026-11-04' }]);
    assert.deepEqual(urls, ['https://finance.yahoo.com/quote/%5EDJI/',
      'https://finance.yahoo.com/quote/%5EDJI/history/']);
    assert.equal(isQuoteFromClosingSession(quotes[0], {
      sessionOpenAt: new Date('2026-11-05T14:00:00Z'),
      sessionCloseAt: new Date('2026-11-05T20:30:00Z'),
    }, new Date('2026-11-05T21:00:00Z')), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('reads an older pending session from one historical page request', async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return new Response(historyHtml('^HSI', 'Nov 3, 2026', '26,123.79'));
  };
  try {
    const { quotes, failures } = await fetchMarketQuotes([{
      symbol: '^HSI', sessionDate: '2026-11-03', historicalOnly: true,
    }]);
    assert.deepEqual(urls, ['https://finance.yahoo.com/quote/%5EHSI/history/']);
    assert.deepEqual(quotes, [{ symbol: '^HSI', sessionDate: '2026-11-03',
      regularMarketPrice: 26123.79, marketState: 'CLOSED' }]);
    assert.equal(failures.size, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('requires a quote from the closing session before settling', () => {
  const market = {
    sessionOpenAt: new Date('2026-11-02T03:45:00Z'),
    sessionCloseAt: new Date('2026-11-02T06:00:00Z'),
  };
  const now = new Date('2026-11-02T06:25:00Z');
  assert.equal(isQuoteFromClosingSession({ sessionDate: '2026-11-02',
    marketState: 'CLOSED' }, market, now), true);
  assert.equal(isQuoteFromClosingSession({ sessionDate: '2026-11-01',
    marketState: 'CLOSED' }, market, now), false);
  assert.equal(isQuoteFromClosingSession({ sessionDate: '2026-11-02',
    marketState: 'REGULAR' }, market, now), false);
  assert.equal(isQuoteFromClosingSession({ sessionDate: '2026-11-02',
    marketState: 'CLOSED' }, market, new Date('2026-11-02T05:59:00Z')), false);
});

test('uses the Korean exchange close even when Yahoo reports an early close', () => {
  const market = {
    countryCode: 'KR',
    sessionOpenAt: new Date('2026-11-04T00:00:00Z'),
    sessionCloseAt: new Date('2026-11-04T05:00:00Z'),
    lastSettledClose: null,
  };
  const close = minimumMarketClose('KR', market.sessionOpenAt);
  assert.equal(close.toISOString(), '2026-11-04T06:30:00.000Z');
  assert.equal(scheduledResultAt(market).toISOString(), '2026-11-04T06:50:00.000Z');
  assert.equal(isResultDue(market, new Date('2026-11-04T06:00:00Z')), false);
  assert.equal(isQuoteFromClosingSession({
    sessionDate: '2026-11-03',
    marketState: 'CLOSED',
  }, market, new Date('2026-11-04T06:40:00Z')), false);
  assert.equal(isQuoteFromClosingSession({
    sessionDate: '2026-11-04',
    marketState: 'REGULAR',
  }, market, new Date('2026-11-04T06:40:00Z')), false);
  assert.equal(isQuoteFromClosingSession({
    sessionDate: '2026-11-04',
    marketState: 'POST',
  }, market, new Date('2026-11-04T06:55:00Z')), false);
  assert.equal(isQuoteFromClosingSession({
    sessionDate: '2026-11-04',
  }, market, new Date('2026-11-04T06:55:00Z')), false);
  assert.equal(isQuoteFromClosingSession({
    sessionDate: '2026-11-04',
    marketState: 'CLOSED',
  }, market, new Date('2026-11-04T06:55:00Z')), true);
});

test('uses Berlin daylight saving time for the German index close', () => {
  assert.equal(minimumMarketClose('DE', new Date('2026-07-01T07:00:00Z'))
    .toISOString(), '2026-07-01T16:00:00.000Z');
  assert.equal(minimumMarketClose('DE', new Date('2026-11-04T08:00:00Z'))
    .toISOString(), '2026-11-04T17:00:00.000Z');
  const market = {
    countryCode: 'DE',
    sessionOpenAt: new Date('2026-11-04T08:00:00Z'),
    sessionCloseAt: new Date('2026-11-04T16:30:00Z'),
    lastSettledClose: null,
  };
  assert.equal(scheduledResultAt(market).toISOString(), '2026-11-04T17:20:00.000Z');
  assert.equal(isResultDue(market, new Date('2026-11-04T16:40:00Z')), false);
  assert.equal(isQuoteFromClosingSession({
    sessionDate: '2026-11-03',
    marketState: 'CLOSED',
  }, market, new Date('2026-11-04T17:20:00Z')), false);
});
