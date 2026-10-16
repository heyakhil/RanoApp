import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  completeProfileSchema,
  firebaseTokenSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post(
  '/google',
  validate(firebaseTokenSchema),
  authController.googleLogin,
);

router.post(
  '/refresh',
  validate(firebaseTokenSchema),
  authController.refreshToken,
);

router.post(
  '/complete-profile',
  requireAuth,
  validate(completeProfileSchema),
  authController.completeProfile,
);

router.get('/me', requireAuth, authController.getMe);

export default router;
