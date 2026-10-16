import { uploadScreenshotToCloudinary } from '../middleware/upload.middleware.js';
import {
  acceptRecharge,
  createRecharge,
  getWallet,
  listRecharges,
  rejectRecharge,
} from '../services/recharge.service.js';
import { saveDeviceToken } from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const create = asyncHandler(async (req, res) => {
  const recharge = await createRecharge(req.auth.userId, {
    amount: req.body.amount,
    referenceId: req.body.referenceId,
    screenshotPath: await uploadScreenshotToCloudinary(req.file),
  });

  return sendSuccess(res, 201, recharge, 'Recharge request submitted');
});

export const wallet = asyncHandler(async (req, res) => {
  const balance = await getWallet(req.auth.userId);
  return sendSuccess(res, 200, balance);
});

export const registerDevice = asyncHandler(async (req, res) => {
  await saveDeviceToken(req.auth.userId, req.body.token);
  return sendSuccess(res, 200, { registered: true });
});

export const list = asyncHandler(async (_req, res) => {
  const recharges = await listRecharges();
  return sendSuccess(res, 200, recharges);
});

export const accept = asyncHandler(async (req, res) => {
  const recharge = await acceptRecharge(req.params.id);
  return sendSuccess(res, 200, recharge, 'Recharge accepted');
});

export const reject = asyncHandler(async (req, res) => {
  const recharge = await rejectRecharge(req.params.id);
  return sendSuccess(res, 200, recharge, 'Recharge rejected');
});
