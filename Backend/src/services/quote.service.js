import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

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

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-RapidAPI-Key': env.rapidApiKey,
        'X-RapidAPI-Host': env.rapidApiHost,
      },
    });
  } catch (error) {
    throw new ApiError(502, 'Unable to reach the market quote API', 'QUOTE_FETCH_FAILED', error);
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      `Market quote API request failed (${response.status})`,
      'QUOTE_FETCH_FAILED',
    );
  }

  const body = await response.json();
  const quotes = body?.quoteResponse?.result;
  if (!Array.isArray(quotes)) {
    throw new ApiError(502, 'Market quote response was invalid', 'QUOTE_RESPONSE_INVALID');
  }

  return quotes;
}
