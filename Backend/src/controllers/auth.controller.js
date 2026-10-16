import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

/**
 * POST /api/v1/auth/google
 * Body: { idToken }
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const result = await authService.authenticateWithFirebase(req.body.idToken);
  return sendSuccess(res, 200, result, 'Authenticated successfully');
});

/**
 * POST /api/v1/auth/refresh
 * Body: { idToken } — used by the client interceptor for silent JWT renewal
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshAccessToken(req.body.idToken);
  return sendSuccess(res, 200, result, 'Token refreshed');
});

/**
 * POST /api/v1/auth/complete-profile
 * Body: { name, mobile, dob, gender }
 */
export const completeProfile = asyncHandler(async (req, res) => {
  const result = await authService.completeProfile(req.auth.userId, req.body);
  return sendSuccess(res, 200, result, 'Profile completed');
});

/**
 * GET /api/v1/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getCurrentUser(req.auth.userId);
  return sendSuccess(res, 200, result);
});
