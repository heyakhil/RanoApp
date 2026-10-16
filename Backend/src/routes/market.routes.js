import { Router } from 'express';
import * as marketController from '../controllers/market.controller.js';
import { requireAdmin, requireAuth, requireCronSecret } from '../middleware/auth.middleware.js';
import { uploadMarketImage } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createMarketSchema,
  declareResultSchema,
  joinMarketSchema,
  marketIdSchema,
  updateMarketSchema,
} from '../validators/market.validator.js';

const router = Router();

router.get('/', marketController.listMarkets);
router.get('/participation', requireAuth, marketController.listMyEntries);
router.get('/orders', requireAuth, marketController.listMyOrders);
router.get('/history', requireAuth, marketController.listResultHistory);
router.post('/results/settle', requireCronSecret, marketController.settleDueResults);
router.post(
  '/:id/join',
  requireAuth,
  validate(marketIdSchema, 'params'),
  validate(joinMarketSchema),
  marketController.joinMarket,
);
router.post(
  '/:id/result',
  requireAdmin,
  validate(marketIdSchema, 'params'),
  validate(declareResultSchema),
  marketController.declareResult,
);
router.post(
  '/:id/image',
  requireAdmin,
  uploadMarketImage,
  validate(marketIdSchema, 'params'),
  marketController.saveMarketImage,
);
router.get('/:id', validate(marketIdSchema, 'params'), marketController.getMarket);
router.post('/', requireAdmin, validate(createMarketSchema), marketController.createMarket);
router.patch(
  '/:id',
  requireAdmin,
  validate(marketIdSchema, 'params'),
  validate(updateMarketSchema),
  marketController.updateMarket,
);
router.delete(
  '/:id',
  requireAdmin,
  validate(marketIdSchema, 'params'),
  marketController.deleteMarket,
);

export default router;
