import * as cheerio from 'cheerio';
import { ApiError } from '../utils/ApiError.js';

const MAX_PAGE_BYTES = 5_000_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** @param {Response} response @returns {Promise<string>} */
async function readPage(response) {
  if (!response.body) throw new Error('Yahoo Finance returned an empty page');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PAGE_BYTES) throw new Error('Yahoo Finance page is too large');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size).toString('utf8');
}

/** @param {string} url @returns {Promise<string>} */
async function fetchPage(url) {
  let response;
  try {
    response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(8_000),
      headers: { Accept: 'text/html', 'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (compatible; RanoMarket/1.0)' } });
  } catch (error) {
    throw new ApiError(502, 'Unable to reach Yahoo Finance', 'QUOTE_FETCH_FAILED', error);
  }
  if (!response.ok) {
    throw new ApiError(502, `Yahoo Finance returned ${response.status}`, 'QUOTE_FETCH_FAILED');
  }
  if (Number(response.headers.get('content-length')) > MAX_PAGE_BYTES) {
    throw new ApiError(502, 'Yahoo Finance page is too large', 'QUOTE_RESPONSE_INVALID');
  }
  try { return await readPage(response); }
  catch (error) {
    throw new ApiError(502, 'Unable to read Yahoo Finance page', 'QUOTE_RESPONSE_INVALID', error);
  }
}

/** @param {unknown} price @returns {string} */
export function digitsAfterDecimal(price) {
  const fraction = String(price).split('.')[1] ?? '';
  return `${fraction.replace(/\D/g, '')}00`.slice(0, 2);
}

/** @param {string} text @returns {number | null} */
function parsePrice(text) {
  if (!/^\d{1,3}(?:,\d{3})*(?:\.\d+)?$|^\d+(?:\.\d+)?$/.test(text)) return null;
  const value = Number(text.replaceAll(',', ''));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** @param {string} html @param {string} symbol */
function loadSymbolPage(html, symbol) {
  const $ = cheerio.load(html);
  const title = $('[data-testid="quote-title"] h1').first().text().trim();
  if (!title.endsWith(`(${symbol})`)) return null;
  return $;
}

/**
 * The quote-specific notice says "Market Open" or "At close". The global
 * market banner describes the US market and is unrelated to this symbol.
 * @param {string} html
 * @param {string} symbol
 * @returns {{symbol: string, regularMarketPrice: number, marketState: 'REGULAR' | 'CLOSED'} | null}
 */
export function parseYahooQuotePage(html, symbol) {
  const $ = loadSymbolPage(html, symbol);
  if (!$) return null;
  const price = parsePrice($('[data-testid="quote-price"] [data-testid="qsp-price"]')
    .first().text().trim());
  const notice = $('[data-testid="quote-price"] [slot="marketTimeNotice"]')
    .first().text().replace(/\s+/g, ' ').trim();
  if (price === null) return null;
  if (/^As of\b.*\bMarket Open\.?$/i.test(notice)) {
    return { symbol, regularMarketPrice: price, marketState: 'REGULAR' };
  }
  if (/^At close:/i.test(notice)) {
    return { symbol, regularMarketPrice: price, marketState: 'CLOSED' };
  }
  return null;
}

/**
 * Confirms the trading date and final close because the quote notice can omit
 * its date and show yesterday's "At close" before today's session starts.
 * @param {string} html
 * @param {string} symbol
 * @param {string | null} sessionDate
 * @returns {{sessionDate: string, regularMarketPrice: number} | null}
 */
export function parseYahooHistoryPage(html, symbol, sessionDate = null) {
  const $ = loadSymbolPage(html, symbol);
  if (!$) return null;
  const table = $('table').toArray().find((element) => {
    const headers = $(element).find('thead th');
    return headers.eq(0).text().trim().startsWith('Date') &&
      headers.eq(4).text().trim().startsWith('Close');
  });
  if (!table) return null;
  for (const row of $(table).find('tbody tr').toArray()) {
    const cells = $(row).find('td');
    const match = /^(\w{3}) (\d{1,2}), (\d{4})$/.exec(cells.eq(0).text().trim());
    const month = match ? MONTHS.indexOf(match[1]) + 1 : 0;
    if (!month) continue;
    const rowDate = `${match[3]}-${String(month).padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    if (new Date(`${rowDate}T00:00:00Z`).getUTCDate() !== Number(match[2])) continue;
    if (sessionDate && rowDate !== sessionDate) continue;
    const price = parsePrice(cells.eq(4).text().trim());
    return price === null ? null : { sessionDate: rowDate, regularMarketPrice: price };
  }
  return null;
}

/** @param {{symbol: string, sessionDate: string, historicalOnly: boolean}[]} requests */
export async function fetchMarketQuotes(requests) {
  const results = await Promise.allSettled(requests.map(async ({ symbol, sessionDate, historicalOnly }) => {
    if (!/^[\^A-Z0-9._=-]{1,20}$/i.test(symbol)) {
      throw new ApiError(400, 'Invalid market symbol', 'INVALID_MARKET_SYMBOL');
    }
    const base = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`;
    if (historicalOnly) {
      const history = parseYahooHistoryPage(await fetchPage(`${base}history/`),
        symbol, sessionDate);
      if (!history) throw new ApiError(502,
        `Yahoo has no dated historical close for ${symbol} on ${sessionDate}`,
        'QUOTE_RESPONSE_INVALID');
      return { symbol, ...history, marketState: 'CLOSED' };
    }
    const quote = parseYahooQuotePage(await fetchPage(base), symbol);
    if (!quote) throw new ApiError(502, `Yahoo quote page is incomplete for ${symbol}`,
      'QUOTE_RESPONSE_INVALID');
    if (quote.marketState === 'REGULAR') return quote;

    const history = parseYahooHistoryPage(await fetchPage(`${base}history/`), symbol);
    if (!history || Math.round(history.regularMarketPrice * 100) !==
        Math.round(quote.regularMarketPrice * 100)) {
      throw new ApiError(502, `Yahoo closing date or price is unconfirmed for ${symbol}`,
        'QUOTE_RESPONSE_INVALID');
    }
    return { ...quote, ...history };
  }));
  const quotes = [];
  const failures = new Map();
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') quotes.push(result.value);
    else {
      console.error('Yahoo quote page failed', result.reason);
      failures.set(requests[index].symbol, result.reason?.message ?? 'Unknown Yahoo quote failure');
    }
  });
  return { quotes, failures };
}
