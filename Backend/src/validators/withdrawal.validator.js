import { z } from 'zod';

const upiIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(255)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*@[A-Za-z0-9][A-Za-z0-9.-]*$/, 'Enter a valid UPI ID');

export const createUpiAccountSchema = z.object({
  upiId: upiIdSchema,
});

export const updateUpiAccountSchema = z.object({
  id: z.string().min(1),
});

export const createWithdrawalSchema = z.object({
  amount: z.coerce.number().int().min(100).max(1_000_000),
  upiAccountId: z.string().min(1),
});

export const reviewWithdrawalSchema = z.object({
  id: z.string().min(1),
});
