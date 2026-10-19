import { z } from 'zod';

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(1024),
});

export const adminChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(1024),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(1024),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });
