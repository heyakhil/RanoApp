import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';
import { uploadPaymentQr } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { paymentDestinationSchema } from '../validators/payment.validator.js';

const router = Router();

router.get('/destination', requireAuth, paymentController.getDestination);
router.put(
  '/destination',
  requireAdmin,
  uploadPaymentQr,
  validate(paymentDestinationSchema),
  paymentController.updateDestination,
);

export default router;
