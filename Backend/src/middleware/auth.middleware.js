import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../services/token.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Extracts Bearer token from Authorization header.
 * @param {import('express').Request} req
 * @returns {string}
 */
function extractBearerToken(req) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization token is required', 'TOKEN_MISSING');
  }

  return header.slice('Bearer '.length).trim();
}

/**
 * Protects routes with the app JWT.
 * On expiry returns code TOKEN_EXPIRED so the client can silently refresh
 * using the Firebase ID token without surfacing an error to the user.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);
  const payload = verifyAccessToken(token);

  req.auth = {
    userId: payload.sub,
    email: payload.email,
    firebaseUid: payload.firebaseUid,
    role: payload.role ?? 'user',
  };

  next();
});

export const requireAdmin = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);
  const payload = verifyAccessToken(token);

  if (payload.role !== 'admin') {
    throw new ApiError(403, 'Admin access is required', 'ADMIN_REQUIRED');
  }

  req.auth = {
    userId: payload.sub,
    email: payload.email,
    firebaseUid: payload.firebaseUid,
    role: 'admin',
  };

  next();
});

function equalSecret(first, second) {
  const firstHash = createHash('sha256').update(first).digest();
  const secondHash = createHash('sha256').update(second).digest();
  return timingSafeEqual(firstHash, secondHash);
}

export const requireCronSecret = asyncHandler(async (req, _res, next) => {
  if (!env.resultCronSecret) {
    throw new ApiError(503, 'Result cron secret is not configured', 'CRON_SECRET_NOT_CONFIGURED');
  }

  const provided = req.get('x-cron-secret') ?? '';
  if (!provided || !equalSecret(provided, env.resultCronSecret)) {
    throw new ApiError(401, 'Invalid cron secret', 'INVALID_CRON_SECRET');
  }

  next();
});
