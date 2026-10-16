import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, transactionController.listMine);

export default router;
