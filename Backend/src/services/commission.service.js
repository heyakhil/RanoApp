import { prisma } from '../config/prisma.js';

export async function settleCommissionBalances() {
  return prisma.$transaction(async (tx) => {
    const accounts = await tx.adminAccount.findMany({
      where: { role: { in: ['admin', 'subadmin'] } },
      orderBy: { role: 'asc' },
      select: { role: true, commissionBalance: true },
    });

    const settled = {
      adminShare: '0',
      subadminShare: '0',
    };

    for (const account of accounts) {
      settled[account.role === 'admin' ? 'adminShare' : 'subadminShare'] =
        account.commissionBalance.toString();
    }

    await tx.adminAccount.updateMany({
      where: { role: { in: ['admin', 'subadmin'] } },
      data: { commissionBalance: 0 },
    });

    return settled;
  });
}
