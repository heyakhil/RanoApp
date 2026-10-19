import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * @typedef {Object} AccessTokenPayload
 * @property {string} sub - User id
 * @property {string} email
 * @property {string} firebaseUid
 * @property {'admin' | 'subadmin'} [role]
 */

/**
 * Issues a short-lived access JWT (default 15 minutes).
 * @param {{ id: string, email: string, firebaseUid: string }} user
 * @returns {string}
 */
export function issueAccessToken(user) {
  /** @type {AccessTokenPayload} */
  const payload = {
    sub: user.id,
    email: user.email,
    firebaseUid: user.firebaseUid,
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Issues an access JWT for an admin account.
 * @param {{ id: string, username: string, role: 'admin' | 'subadmin' }} account
 * @returns {string}
 */
export function issueAdminAccessToken(account) {
  /** @type {AccessTokenPayload} */
  const payload = {
    sub: `admin:${account.id}`,
    email: account.username,
    firebaseUid: '',
    role: account.role,
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.adminJwtExpiresInSeconds,
  });
}

/**
 * Verifies an access JWT.
 * @param {string} token
 * @returns {AccessTokenPayload & { iat: number, exp: number }}
 */
export function verifyAccessToken(token) {
  try {
    return /** @type {AccessTokenPayload & { iat: number, exp: number }} */ (
      jwt.verify(token, env.jwtSecret)
    );
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Access token expired', 'TOKEN_EXPIRED');
    }

    throw new ApiError(401, 'Invalid access token', 'TOKEN_INVALID');
  }
}
