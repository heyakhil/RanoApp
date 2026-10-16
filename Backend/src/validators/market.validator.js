import { z } from 'zod';
import { paginationQuerySchema } from './pagination.validator.js';

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
  entryAmount: z.number().finite().min(0).max(99999999.99),
};

const validMarketHours = (market) => market.openTime !== market.closeTime;

export const createMarketSchema = z
  .object(marketFields)
  .refine(validMarketHours, {
    message: 'Close time must differ from open time. An earlier close time is the next day.',
    path: ['closeTime'],
  });

export const updateMarketSchema = z
  .object({
    name: marketFields.name.optional(),
    symbol: marketFields.symbol.optional(),
    openTime: marketFields.openTime.optional(),
    closeTime: marketFields.closeTime.optional(),
    maxParticipants: marketFields.maxParticipants.optional(),
    entryAmount: marketFields.entryAmount.optional(),
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
  );

export const marketIdSchema = z.object({
  id: z.string().min(1),
});

export const declareResultSchema = z.object({
  result: z.string().trim().min(1).max(120),
});

export const joinMarketSchema = z.object({
  number: z.number().int().min(1).max(99),
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
