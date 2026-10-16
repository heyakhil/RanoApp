import { z } from 'zod';

export const firebaseTokenSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
});

export const completeProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  dob: z
    .string()
    .or(z.date())
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: 'Enter a valid date of birth',
    })
    .refine((value) => new Date(value) < new Date(), {
      message: 'Date of birth must be in the past',
    }),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
});
