import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { adminLoginSchema } from '../validators/admin.validator.js';

const router = Router();

router.post('/login', validate(adminLoginSchema), adminController.login);
router.get('/overview', requireAdmin, adminController.getOverview);
router.get('/users', requireAdmin, adminController.getUsers);

export default router;
