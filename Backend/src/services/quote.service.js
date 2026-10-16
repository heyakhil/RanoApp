import https from 'node:https';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const quoteAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
  maxSockets: 4,
  scheduling: 'fifo',
});

/**
 * First two digits after the decimal point. 81234.7 becomes "70".
 * @param {unknown} price
 * @returns {string}
 */
export function digitsAfterDecimal(price) {
  const text = String(price);
  const fraction = text.includes('.') ? text.split('.')[1] : '';
  const digits = fraction.replace(/\D/g, '');

  return `${digits}00`.slice(0, 2);
}

/**
 * Loads quotes for the given Yahoo symbols.
 * @param {string[]} symbols
 */
export async function fetchMarketQuotes(symbols) {
  if (!env.rapidApiKey) {
    throw new ApiError(
      503,
      'Market result API key is not configured',
      'RESULT_API_NOT_CONFIGURED',
    );
  }

  const url = new URL(env.yahooQuotesUrl);
  url.searchParams.set('symbols', symbols.join(','));

  let status;
  let rawBody;
  try {
    ({ status, rawBody } = await requestQuote(url));
  } catch (error) {
    throw new ApiError(502, 'Unable to reach the market quote API', 'QUOTE_FETCH_FAILED', error);
  }

  if (status < 200 || status >= 300) {
    throw new ApiError(
      502,
      `Market quote API request failed (${status})`,
      'QUOTE_FETCH_FAILED',
    );
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (error) {
    throw new ApiError(502, 'Market quote response was invalid', 'QUOTE_RESPONSE_INVALID', error);
  }
  const quotes = body?.quoteResponse?.result;
  if (!Array.isArray(quotes)) {
    throw new ApiError(502, 'Market quote response was invalid', 'QUOTE_RESPONSE_INVALID');
  }

  return quotes;
}

function requestQuote(url) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        agent: quoteAgent,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-RapidAPI-Key': env.rapidApiKey,
          'X-RapidAPI-Host': env.rapidApiHost,
        },
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            status: response.statusCode ?? 0,
            rawBody: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );

    request.setTimeout(8_000, () => {
      request.destroy(new Error('Quote request timed out'));
    });
    request.on('error', reject);
    request.end();
  });
}
