import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * @type {PrismaClient | undefined}
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProduction ? ['error'] : ['error', 'warn'],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}
