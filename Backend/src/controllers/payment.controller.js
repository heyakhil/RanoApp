import { uploadImageToCloudinary } from '../middleware/upload.middleware.js';
import {
  getPaymentDestination,
  savePaymentDestination,
} from '../services/payment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getDestination = asyncHandler(async (_req, res) => {
  const destination = await getPaymentDestination();
  return sendSuccess(res, 200, destination);
});

export const updateDestination = asyncHandler(async (req, res) => {
  const qrImageUrl = req.file
    ? await uploadImageToCloudinary(req.file, 'rano/payment-qr', 'Upload a QR image')
    : undefined;
  const destination = await savePaymentDestination(req.body.upiId, qrImageUrl);
  return sendSuccess(res, 200, destination, 'Payment details saved');
});
