import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { issueAdminAccessToken } from './token.service.js';

const ADMIN_SUBJECT_PREFIX = 'admin:';

export async function loginAdmin(username, password) {
  const account = await prisma.adminAccount.findUnique({ where: { username } });
  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    throw new ApiError(401, 'Invalid username or password', 'INVALID_ADMIN_CREDENTIALS');
  }

  return {
    accessToken: issueAdminAccessToken(account),
    expiresIn: env.adminJwtExpiresInSeconds,
    user: {
      username: account.username,
      name: account.role === 'admin' ? 'Admin' : 'Subadmin',
      role: account.role === 'admin' ? 'Administrator' : 'Subadministrator',
      accountRole: account.role,
    },
  };
}

/**
 * Changes the password of the signed-in admin/subadmin account.
 * @param {string} subject JWT subject in the form `admin:<accountId>`
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export async function changeAdminPassword(subject, currentPassword, newPassword) {
  if (typeof subject !== 'string' || !subject.startsWith(ADMIN_SUBJECT_PREFIX)) {
    throw new ApiError(403, 'Admin access is required', 'ADMIN_REQUIRED');
  }

  const id = subject.slice(ADMIN_SUBJECT_PREFIX.length);
  const account = await prisma.adminAccount.findUnique({ where: { id } });
  if (!account) {
    throw new ApiError(404, 'Admin account not found', 'ADMIN_NOT_FOUND');
  }

  if (!(await verifyPassword(currentPassword, account.passwordHash))) {
    throw new ApiError(400, 'Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
  }

  await prisma.adminAccount.update({
    where: { id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
}
