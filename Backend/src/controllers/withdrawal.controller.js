import * as withdrawalService from '../services/withdrawal.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listUpiAccounts = asyncHandler(async (req, res) => {
  const accounts = await withdrawalService.listUpiAccounts(req.auth.userId);
  return sendSuccess(res, 200, accounts);
});

export const createUpiAccount = asyncHandler(async (req, res) => {
  const account = await withdrawalService.createUpiAccount(req.auth.userId, req.body.upiId);
  return sendSuccess(res, 201, account, 'UPI ID added');
});

export const updateUpiAccount = asyncHandler(async (req, res) => {
  const account = await withdrawalService.updateUpiAccount(
    req.auth.userId,
    req.params.id,
    req.body.upiId,
  );
  return sendSuccess(res, 200, account, 'UPI ID updated');
});

export const deleteUpiAccount = asyncHandler(async (req, res) => {
  await withdrawalService.deleteUpiAccount(req.auth.userId, req.params.id);
  return sendSuccess(res, 200, { deleted: true }, 'UPI ID deleted');
});

export const create = asyncHandler(async (req, res) => {
  const withdrawal = await withdrawalService.createWithdrawal(req.auth.userId, {
    amount: req.body.amount,
    upiAccountId: req.body.upiAccountId,
  });
  return sendSuccess(res, 201, withdrawal, 'Withdrawal request submitted');
});

export const list = asyncHandler(async (_req, res) => {
  const withdrawals = await withdrawalService.listWithdrawals();
  return sendSuccess(res, 200, withdrawals);
});

export const accept = asyncHandler(async (req, res) => {
  const withdrawal = await withdrawalService.acceptWithdrawal(req.params.id);
  return sendSuccess(res, 200, withdrawal, 'Withdrawal accepted');
});

export const reject = asyncHandler(async (req, res) => {
  const withdrawal = await withdrawalService.rejectWithdrawal(req.params.id);
  return sendSuccess(res, 200, withdrawal, 'Withdrawal rejected');
});
