import { changeAdminPassword, loginAdmin } from '../services/admin.service.js';
import {
  getAdminPushPublicKey,
  removeAdminPushSubscription,
  saveAdminPushSubscription,
} from '../services/admin-push.service.js';
import { listUsers } from '../services/admin-user.service.js';
import { getBettingOverview } from '../services/bet.service.js';
import { settleCommissionBalances } from '../services/commission.service.js';
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

export const settleCommission = asyncHandler(async (_req, res) => {
  const settled = await settleCommissionBalances();
  return sendSuccess(res, 200, settled, 'Commission balances settled successfully');
});

export const pushPublicKey = asyncHandler(async (_req, res) => {
  return sendSuccess(res, 200, { publicKey: getAdminPushPublicKey() });
});

export const subscribePush = asyncHandler(async (req, res) => {
  await saveAdminPushSubscription(req.auth.userId, req.body);
  return sendSuccess(res, 200, { subscribed: true });
});

export const unsubscribePush = asyncHandler(async (req, res) => {
  await removeAdminPushSubscription(req.auth.userId, req.body.endpoint);
  return sendSuccess(res, 200, { subscribed: false });
});

export const getUsers = asyncHandler(async (req, res) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await listUsers(query);
  return sendSuccess(res, 200, result);
});
