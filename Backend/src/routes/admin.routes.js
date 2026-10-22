import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { requireAdmin, requireAdminOrSubadmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { adminChangePasswordSchema, adminLoginSchema } from '../validators/admin.validator.js';

const router = Router();

router.post('/login', validate(adminLoginSchema), adminController.login);
router.post(
  '/change-password',
  requireAdminOrSubadmin,
  validate(adminChangePasswordSchema),
  adminController.changePassword,
);
router.get('/overview', requireAdminOrSubadmin, adminController.getOverview);
router.post('/commission/settle', requireAdmin, adminController.settleCommission);
router.get('/users', requireAdmin, adminController.getUsers);

export default router;
