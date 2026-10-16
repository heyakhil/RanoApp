/**
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {unknown} data
 * @param {string} [message]
 */
export function sendSuccess(res, statusCode, data, message) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}
