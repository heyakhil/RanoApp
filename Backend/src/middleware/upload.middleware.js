import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new ApiError(400, 'Upload a PNG or JPG screenshot', 'INVALID_SCREENSHOT'));
      return;
    }

    callback(null, true);
  },
});

export const uploadScreenshot = upload.single('screenshot');
export const uploadPaymentQr = upload.single('qr');

const marketImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new ApiError(400, 'Upload a PNG, JPG, or WEBP image', 'INVALID_IMAGE'));
      return;
    }

    callback(null, true);
  },
});

export function uploadMarketImage(req, res, next) {
  marketImageUpload.single('image')(req, res, (error) => {
    if (error?.code === 'LIMIT_FILE_SIZE') {
      next(new ApiError(400, 'Market image must be 1MB or smaller', 'IMAGE_TOO_LARGE'));
      return;
    }

    next(error);
  });
}

/**
 * Uploads an image to Cloudinary and returns its secure URL.
 * @param {Express.Multer.File | undefined} file
 * @param {string} folder
 * @param {string} missingMessage
 * @returns {Promise<string>}
 */
export function uploadImageToCloudinary(
  file,
  folder,
  missingMessage = 'Payment screenshot is required',
) {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;

  if (!file) {
    throw new ApiError(400, missingMessage, 'SCREENSHOT_REQUIRED');
  }

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError(
      500,
      'Cloudinary is not configured. Set CLOUDINARY_API_SECRET in the backend environment.',
      'CLOUDINARY_NOT_CONFIGURED',
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(new ApiError(502, 'Could not store the screenshot', 'CLOUDINARY_UPLOAD_FAILED'));
          return;
        }

        resolve(result.secure_url);
      },
    );

    Readable.from(file.buffer).pipe(stream);
  });
}

/**
 * Uploads the payment screenshot to Cloudinary and returns its secure URL.
 * @param {Express.Multer.File | undefined} file
 * @returns {Promise<string>}
 */
export function uploadScreenshotToCloudinary(file) {
  return uploadImageToCloudinary(file, 'rano/recharges');
}
