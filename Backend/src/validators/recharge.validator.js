import { z } from 'zod';

export const createRechargeSchema = z.object({
  amount: z.coerce.number().int().min(100).max(1_000_000),
  referenceId: z.string().trim().min(4).max(80),
});

export const deviceTokenSchema = z.object({
  token: z.string().trim().min(20).max(255),
});

export const reviewRechargeSchema = z.object({
  id: z.string().min(1),
});
