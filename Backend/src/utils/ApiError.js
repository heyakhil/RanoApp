export class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {string} [code]
   * @param {unknown} [details]
   */
  constructor(statusCode, message, code = 'ERROR', details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
