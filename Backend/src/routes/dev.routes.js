// TEMPORARY: testing helper — remove before release.
// Only mounted when NODE_ENV !== 'production' (see routes/index.js).
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

/**
 * GET /api/v1/dev/token?email=<email> | ?userId=<id> [&expiresIn=24h]
 * Returns a user access JWT without going through Firebase.
 */
router.get(
  '/token',
  asyncHandler(async (req, res) => {
    const { email, userId, expiresIn = '24h' } = req.query;

    if (!email && !userId) {
      throw new ApiError(400, 'Provide email or userId', 'VALIDATION_ERROR');
    }

    const user = userId
      ? await prisma.user.findUnique({ where: { id: String(userId) } })
      : await prisma.user.findFirst({ where: { email: String(email) } });

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, firebaseUid: user.firebaseUid },
      env.jwtSecret,
      { expiresIn: String(expiresIn) },
    );

    return sendSuccess(res, 200, {
      accessToken,
      expiresIn,
      user: { id: user.id, email: user.email, name: user.name },
    });
  }),
);

export default router;
