import { Router } from 'express';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import marketRoutes from './market.routes.js';
import rechargeRoutes from './recharge.routes.js';
import withdrawalRoutes from './withdrawal.routes.js';
import transactionRoutes from './transaction.routes.js';
import paymentRoutes from './payment.routes.js';
import devRoutes from './dev.routes.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
  });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/markets', marketRoutes);
router.use('/recharges', rechargeRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/transactions', transactionRoutes);
router.use('/payments', paymentRoutes);

// TEMPORARY: testing-only token endpoint — never exposed in production
if (!env.isProduction) {
  router.use('/dev', devRoutes);
}

export default router;
