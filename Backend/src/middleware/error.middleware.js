import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * 404 handler for unknown routes.
 * @param {import('express').Request} _req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
export function notFoundHandler(_req, _res, next) {
  next(new ApiError(404, 'Route not found', 'NOT_FOUND'));
}

/**
 * Central error handler.
 * @param {Error} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten(),
    });
  }

  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Screenshot must be 5MB or smaller'
        : 'Could not upload the screenshot';

    return res.status(400).json({
      success: false,
      message,
      code: 'UPLOAD_ERROR',
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    message: env.isProduction ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
}
