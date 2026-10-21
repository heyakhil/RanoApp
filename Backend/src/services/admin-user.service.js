import { prisma } from '../config/prisma.js';
import { toPublicUser } from './user.service.js';

export async function listUsers({ page, pageSize }) {
  const skip = (page - 1) * pageSize;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count(),
  ]);

  return {
    users: users.map((user) => ({
      ...toPublicUser(user),
      walletBalance: user.walletBalance.toString(),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}
