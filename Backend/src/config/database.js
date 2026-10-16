import { prisma } from './prisma.js';

/**
 * Opens the Prisma MySQL connection and verifies it is reachable.
 * @returns {Promise<import('@prisma/client').PrismaClient>}
 */
export async function connectDatabase() {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  return prisma;
}

/**
 * Gracefully closes the Prisma connection.
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}
