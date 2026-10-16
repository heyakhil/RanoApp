import { Router } from 'express';
import * as withdrawalController from '../controllers/withdrawal.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createUpiAccountSchema,
  createWithdrawalSchema,
  reviewWithdrawalSchema,
  updateUpiAccountSchema,
} from '../validators/withdrawal.validator.js';

const router = Router();

router.get('/upi', requireAuth, withdrawalController.listUpiAccounts);
router.post('/upi', requireAuth, validate(createUpiAccountSchema), withdrawalController.createUpiAccount);
router.patch(
  '/upi/:id',
  requireAuth,
  validate(updateUpiAccountSchema, 'params'),
  validate(createUpiAccountSchema),
  withdrawalController.updateUpiAccount,
);
router.delete(
  '/upi/:id',
  requireAuth,
  validate(updateUpiAccountSchema, 'params'),
  withdrawalController.deleteUpiAccount,
);
router.post('/', requireAuth, validate(createWithdrawalSchema), withdrawalController.create);
router.get('/', requireAdmin, withdrawalController.list);
router.post(
  '/:id/accept',
  requireAdmin,
  validate(reviewWithdrawalSchema, 'params'),
  withdrawalController.accept,
);
router.post(
  '/:id/reject',
  requireAdmin,
  validate(reviewWithdrawalSchema, 'params'),
  withdrawalController.reject,
);

export default router;
