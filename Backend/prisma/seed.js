import '../src/config/env.js';
import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';

const accountsToSeed = [
  {
    role: 'admin',
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  },
  {
    role: 'subadmin',
    username: process.env.SUBADMIN_USERNAME,
    password: process.env.SUBADMIN_PASSWORD,
  },
];

if (accountsToSeed.some(({ username, password }) => !username || !password)) {
  throw new Error(
    'ADMIN_USERNAME, ADMIN_PASSWORD, SUBADMIN_USERNAME, and SUBADMIN_PASSWORD are required to seed admin accounts',
  );
}

if (accountsToSeed[0].username === accountsToSeed[1].username) {
  throw new Error('Admin and subadmin usernames must be different');
}

try {
  for (const account of accountsToSeed) {
    const passwordHash = await hashPassword(account.password);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.adminAccount.findUnique({
        where: { username: account.username },
      });
      if (existing && existing.role !== account.role) {
        throw new Error(`Username ${account.username} is already assigned another role`);
      }

      const legacyCommission = await tx.commissionEntry.aggregate({
        where: { role: account.role, accountId: null },
        _sum: { amount: true },
      });
      const legacyAmount = legacyCommission._sum.amount ?? 0;
      const savedAccount = existing
        ? await tx.adminAccount.update({
            where: { id: existing.id },
            data: {
              passwordHash,
              ...(Number(legacyAmount) > 0
                ? { commissionBalance: { increment: legacyAmount } }
                : {}),
            },
          })
        : await tx.adminAccount.create({
            data: {
              username: account.username,
              passwordHash,
              role: account.role,
              commissionBalance: legacyAmount,
            },
          });

      await tx.commissionEntry.updateMany({
        where: { role: account.role, accountId: null },
        data: { accountId: savedAccount.id },
      });
    });
  }

  console.info('Admin and subadmin accounts are ready.');
} finally {
  await prisma.$disconnect();
}
