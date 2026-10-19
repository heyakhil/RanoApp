import { changeAdminPassword, loginAdmin } from '../services/admin.service.js';
import { listUsers } from '../services/admin-user.service.js';
import { getBettingOverview } from '../services/bet.service.js';
import { listUsersQuerySchema } from '../validators/user.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const login = asyncHandler(async (req, res) => {
  const session = await loginAdmin(req.body.username, req.body.password);
  return sendSuccess(res, 200, session, 'Admin authenticated successfully');
});

export const changePassword = asyncHandler(async (req, res) => {
  await changeAdminPassword(req.auth.userId, req.body.currentPassword, req.body.newPassword);
  return sendSuccess(res, 200, null, 'Password changed successfully');
});

export const getOverview =asyncHandler(async (_req, res) => {
  const overview = await getBettingOverview();
  return sendSuccess(res, 200, overview);
});

export const getUsers = asyncHandler(async (req, res) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await listUsers(query);
  return sendSuccess(res, 200, result);
});
