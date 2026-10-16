import { uploadImageToCloudinary } from '../middleware/upload.middleware.js';
import * as betService from '../services/bet.service.js';
import * as marketService from '../services/market.service.js';
import { ApiError } from '../utils/ApiError.js';
import { assertMarketImageSize } from '../utils/imageDimensions.js';
import { paginationQuerySchema } from '../validators/pagination.validator.js';
import { resultHistoryQuerySchema } from '../validators/market.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listMarkets = asyncHandler(async (_req, res) => {
  const markets = await marketService.listMarkets();
  return sendSuccess(res, 200, markets);
});

export const getMarket = asyncHandler(async (req, res) => {
  const market = await marketService.getMarket(req.params.id);
  return sendSuccess(res, 200, market);
});

export const createMarket = asyncHandler(async (req, res) => {
  const market = await marketService.createMarket(req.body);
  return sendSuccess(res, 201, market, 'Market created');
});

export const updateMarket = asyncHandler(async (req, res) => {
  const market = await marketService.updateMarket(req.params.id, req.body);
  return sendSuccess(res, 200, market, 'Market updated');
});

export const saveMarketImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Market image is required', 'IMAGE_REQUIRED');
  }

  assertMarketImageSize(req.file.buffer, req.file.mimetype);
  const imageUrl = await uploadImageToCloudinary(
    req.file,
    'rano/markets',
    'Market image is required',
  );
  const market = await marketService.updateMarket(req.params.id, { imageUrl });
  return sendSuccess(res, 200, market, 'Market image saved');
});

export const deleteMarket = asyncHandler(async (req, res) => {
  await marketService.deleteMarket(req.params.id);
  return sendSuccess(res, 200, { id: req.params.id }, 'Market deleted');
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const query = paginationQuerySchema.parse(req.query);
  const orders = await betService.listUserOrders(req.auth.userId, query);
  return sendSuccess(res, 200, orders);
});

export const listMyEntries = asyncHandler(async (req, res) => {
  const marketIds = await betService.listJoinedMarketIds(req.auth.userId);
  return sendSuccess(res, 200, { marketIds });
});

export const joinMarket = asyncHandler(async (req, res) => {
  const entry = await betService.joinMarket(req.auth.userId, req.params.id, req.body.number);
  return sendSuccess(res, 201, entry, 'Joined market');
});

export const declareResult = asyncHandler(async (req, res) => {
  const market = await betService.declareMarketResult(req.params.id, req.body.result);
  return sendSuccess(res, 200, market, 'Result declared and market restarted');
});

export const listResultHistory = asyncHandler(async (req, res) => {
  const query = resultHistoryQuerySchema.parse(req.query);
  const rounds = await betService.listResultHistory(
    query.from,
    query.to,
    query,
  );
  return sendSuccess(res, 200, rounds);
});

export const settleDueResults = asyncHandler(async (_req, res) => {
  const result = await betService.settleDueMarkets();
  return sendSuccess(res, 200, result, 'Due market results settled');
});
