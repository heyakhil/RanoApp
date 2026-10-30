import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * @typedef {Object} EnvConfig
 * @property {number} port
 * @property {string} nodeEnv
 * @property {string} databaseUrl
 * @property {string} jwtSecret
 * @property {string} jwtExpiresIn
 * @property {number} adminJwtExpiresInSeconds
 * @property {string} firebaseServiceAccountPath
 * @property {string[]} corsOrigins
 * @property {{ cloudName: string, apiKey: string, apiSecret: string }} cloudinary
 * @property {number} commissionPercent
 * @property {string} rapidApiKey
 * @property {string} rapidApiHost
 * @property {string} yahooQuotesUrl
 * @property {string} yahooMarketTimeUrl
 * @property {number} betCutoffMinutes
 * @property {number} resultDelayMinutes
 * @property {number} resultWaitMinutes
 * @property {string} resultCronSecret
 * @property {string} vapidSubject
 * @property {string} vapidPublicKey
 * @property {string} vapidPrivateKey
 * @property {boolean} isProduction
 */

/**
 * @returns {EnvConfig}
 */
function loadEnv() {
  const jwtSecret = process.env.JWT_SECRET;
  const databaseUrl = process.env.DATABASE_URL;
  const adminJwtExpiresInSeconds = Number(
    process.env.ADMIN_JWT_EXPIRES_IN_SECONDS || 7 * 24 * 60 * 60,
  );

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required in environment variables');
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required in environment variables');
  }

  if (!Number.isSafeInteger(adminJwtExpiresInSeconds) || adminJwtExpiresInSeconds <= 0) {
    throw new Error('ADMIN_JWT_EXPIRES_IN_SECONDS must be a positive integer');
  }

  const resultDelayMinutes = Number(process.env.RESULT_DELAY_MINUTES ?? 0);
  if (!Number.isInteger(resultDelayMinutes) || resultDelayMinutes < 0) {
    throw new Error('RESULT_DELAY_MINUTES must be a whole number of minutes');
  }

  const resultWaitMinutes = Number(process.env.RESULT_WAIT_MINUTES ?? 15);
  if (!Number.isInteger(resultWaitMinutes) || resultWaitMinutes < 0) {
    throw new Error('RESULT_WAIT_MINUTES must be a whole number of minutes');
  }

  const betCutoffMinutes = Number(process.env.BET_CUTOFF_MINUTES ?? 15);
  if (!Number.isInteger(betCutoffMinutes) || betCutoffMinutes < 0) {
    throw new Error('BET_CUTOFF_MINUTES must be a non-negative whole number');
  }

  const commissionPercent = Number(process.env.COMMISSION_PERCENT ?? 10);
  if (
    !Number.isFinite(commissionPercent) ||
    commissionPercent < 0 ||
    commissionPercent > 100
  ) {
    throw new Error('COMMISSION_PERCENT must be a number from 0 to 100');
  }

  return {
    port: Number(process.env.PORT) || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl,
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    adminJwtExpiresInSeconds,
    firebaseServiceAccountPath:
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      './firebase-service-account.json',
    corsOrigins: (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
    commissionPercent,
    rapidApiKey: process.env.RAPIDAPI_KEY || '',
    rapidApiHost: process.env.RAPIDAPI_HOST || 'yahoo-finance166.p.rapidapi.com',
    yahooQuotesUrl:
      process.env.YAHOO_QUOTES_URL ||
      'https://yahoo-finance166.p.rapidapi.com/api/market/get-quote-v2',
    yahooMarketTimeUrl: process.env.YAHOO_MARKET_TIME_URL ||
      'https://yahoo-finance166.p.rapidapi.com/api/market/get-market-time',
    betCutoffMinutes,
    resultDelayMinutes,
    resultWaitMinutes,
    resultCronSecret: process.env.RESULT_CRON_SECRET || '',
    vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@ranoapps.com',
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

export const env = loadEnv();
