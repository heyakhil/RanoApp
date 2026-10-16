import { Router } from 'express';
import * as rechargeController from '../controllers/recharge.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';
import { uploadScreenshot } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createRechargeSchema,
  deviceTokenSchema,
  reviewRechargeSchema,
} from '../validators/recharge.validator.js';

const router = Router();

router.get('/wallet', requireAuth, rechargeController.wallet);
router.post('/device-token', requireAuth, validate(deviceTokenSchema), rechargeController.registerDevice);
router.post('/', requireAuth, uploadScreenshot, validate(createRechargeSchema), rechargeController.create);
router.get('/', requireAdmin, rechargeController.list);
router.post(
  '/:id/accept',
  requireAdmin,
  validate(reviewRechargeSchema, 'params'),
  rechargeController.accept,
);
router.post(
  '/:id/reject',
  requireAdmin,
  validate(reviewRechargeSchema, 'params'),
  rechargeController.reject,
);

export default router;
