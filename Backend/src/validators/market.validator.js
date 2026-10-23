import { z } from 'zod';
import { paginationQuerySchema } from './pagination.validator.js';

const hasTwoDecimals = (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

const money = z
  .number()
  .finite()
  .positive()
  .max(99999999.99)
  .refine(hasTwoDecimals, 'Use at most two decimal places');

const marketFields = {
  name: z.string().trim().min(1).max(80),
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .transform((symbol) => symbol.toUpperCase()),
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:mm time'),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:mm time'),
  maxParticipants: z.number().int().positive().max(2147483647),
  minBetAmount: money,
  maxBetAmount: money,
};

const validMarketHours = (market) => market.openTime !== market.closeTime;
const betRangeMessage = {
  message: 'Maximum bet amount must be greater than or equal to the minimum',
  path: ['maxBetAmount'],
};

export const createMarketSchema = z
  .object(marketFields)
  .refine(validMarketHours, {
    message: 'Close time must differ from open time. An earlier close time is the next day.',
    path: ['closeTime'],
  })
  .refine((market) => market.minBetAmount <= market.maxBetAmount, betRangeMessage);

export const updateMarketSchema = z
  .object({
    name: marketFields.name.optional(),
    symbol: marketFields.symbol.optional(),
    openTime: marketFields.openTime.optional(),
    closeTime: marketFields.closeTime.optional(),
    maxParticipants: marketFields.maxParticipants.optional(),
    minBetAmount: marketFields.minBetAmount.optional(),
    maxBetAmount: marketFields.maxBetAmount.optional(),
  })
  .refine((market) => Object.keys(market).length > 0, {
    message: 'At least one market field must be provided',
  })
  .refine(
    (market) =>
      market.openTime === undefined ||
      market.closeTime === undefined ||
      validMarketHours(market),
    {
      message: 'Close time must differ from open time. An earlier close time is the next day.',
      path: ['closeTime'],
    },
  )
  .refine(
    (market) =>
      market.minBetAmount === undefined ||
      market.maxBetAmount === undefined ||
      market.minBetAmount <= market.maxBetAmount,
    betRangeMessage,
  );

export const marketIdSchema = z.object({
  id: z.string().min(1),
});

export const declareResultSchema = z.object({
  result: z.string().trim().min(1).max(120),
});

export const joinMarketSchema = z
  .object({
    number: z.number().int().min(1).max(99),
    amount: money,
    side: z.enum(['andar', 'bahar']).optional(),
  })
  .superRefine((body, ctx) => {
    if (body.number <= 9 && body.side === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose Andar or Bahar for a single-digit number',
        path: ['side'],
      });
    }
  });

export const resultHistoryQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    page: paginationQuerySchema.shape.page,
    pageSize: paginationQuerySchema.shape.pageSize,
  })
  .refine((query) => query.from < query.to, {
    message: 'History end must be after the start',
    path: ['to'],
  });
