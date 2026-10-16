import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { issueAdminAccessToken } from './token.service.js';

function equalSecret(first, second) {
  const firstHash = createHash('sha256').update(first).digest();
  const secondHash = createHash('sha256').update(second).digest();
  return timingSafeEqual(firstHash, secondHash);
}

export function loginAdmin(username, password) {
  if (!env.adminUsername || !env.adminPassword) {
    throw new ApiError(
      503,
      'Admin login is not configured on the server',
      'ADMIN_LOGIN_NOT_CONFIGURED',
    );
  }

  const usernameMatches = equalSecret(username, env.adminUsername);
  const passwordMatches = equalSecret(password, env.adminPassword);
  if (!usernameMatches || !passwordMatches) {
    throw new ApiError(401, 'Invalid username or password', 'INVALID_ADMIN_CREDENTIALS');
  }

  return {
    accessToken: issueAdminAccessToken(env.adminUsername),
    expiresIn: env.adminJwtExpiresInSeconds,
    user: {
      username: env.adminUsername,
      name: 'Admin User',
      role: 'Administrator',
    },
  };
}
