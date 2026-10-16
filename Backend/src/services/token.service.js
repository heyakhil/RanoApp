import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * @typedef {Object} AccessTokenPayload
 * @property {string} sub - User id
 * @property {string} email
 * @property {string} firebaseUid
 * @property {'admin'} [role]
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
 * Issues an access JWT for a configured admin account.
 * @param {string} username
 * @returns {string}
 */
export function issueAdminAccessToken(username) {
  /** @type {AccessTokenPayload} */
  const payload = {
    sub: `admin:${username}`,
    email: username,
    firebaseUid: '',
    role: 'admin',
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
