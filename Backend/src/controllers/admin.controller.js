import { loginAdmin } from '../services/admin.service.js';
import { listUsers } from '../services/admin-user.service.js';
import { getBettingOverview } from '../services/bet.service.js';
import { listUsersQuerySchema } from '../validators/user.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const login = asyncHandler(async (req, res) => {
  const session = loginAdmin(req.body.username, req.body.password);
  return sendSuccess(res, 200, session, 'Admin authenticated successfully');
});

export const getOverview = asyncHandler(async (_req, res) => {
  const overview = await getBettingOverview();
  return sendSuccess(res, 200, overview);
});

export const getUsers = asyncHandler(async (req, res) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await listUsers(query);
  return sendSuccess(res, 200, result);
});
