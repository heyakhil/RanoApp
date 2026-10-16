import { listUserTransactions } from '../services/transaction.service.js';
import { paginationQuerySchema } from '../validators/pagination.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listMine = asyncHandler(async (req, res) => {
  const query = paginationQuerySchema.parse(req.query);
  const transactions = await listUserTransactions(req.auth.userId, query);
  return sendSuccess(res, 200, transactions);
});
