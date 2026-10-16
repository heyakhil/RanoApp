import { z } from 'zod';

export const paymentDestinationSchema = z.object({
  upiId: z
    .string()
    .trim()
    .min(3)
    .max(255)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*@[A-Za-z0-9][A-Za-z0-9.-]*$/,
      'Enter a valid UPI ID',
    ),
});
