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
 * @property {string | undefined} adminUsername
 * @property {string | undefined} adminPassword
 * @property {string[]} corsOrigins
 * @property {{ cloudName: string, apiKey: string, apiSecret: string }} cloudinary
 * @property {number} commissionPercent
 * @property {string} rapidApiKey
 * @property {string} rapidApiHost
 * @property {string} yahooQuotesUrl
 * @property {number} resultDelayMinutes
 * @property {string} resultCronSecret
 * @property {boolean} isProduction
 */

/**
 * @returns {EnvConfig}
 */
function loadEnv() {
  const jwtSecret = process.env.JWT_SECRET;
  const databaseUrl = process.env.DATABASE_URL;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminJwtExpiresInSeconds = Number(
    process.env.ADMIN_JWT_EXPIRES_IN_SECONDS || 7 * 24 * 60 * 60,
  );

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required in environment variables');
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required in environment variables');
  }

  if (Boolean(adminUsername) !== Boolean(adminPassword)) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must both be configured');
  }

  if (!Number.isSafeInteger(adminJwtExpiresInSeconds) || adminJwtExpiresInSeconds <= 0) {
    throw new Error('ADMIN_JWT_EXPIRES_IN_SECONDS must be a positive integer');
  }

  const resultDelayMinutes = Number(process.env.RESULT_DELAY_MINUTES ?? 15);
  if (!Number.isInteger(resultDelayMinutes) || resultDelayMinutes < 0) {
    throw new Error('RESULT_DELAY_MINUTES must be a whole number of minutes');
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
    adminUsername,
    adminPassword,
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
    resultDelayMinutes,
    resultCronSecret: process.env.RESULT_CRON_SECRET || '',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

export const env = loadEnv();
