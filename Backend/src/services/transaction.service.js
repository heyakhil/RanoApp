import { prisma } from '../config/prisma.js';

function moneyNumber(value) {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

export async function listUserTransactions(userId, { page, pageSize }) {
  const skip = (page - 1) * pageSize;
  const take = skip + pageSize + 1;
  const [recharges, withdrawals] = await Promise.all([
    prisma.rechargeRequest.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    }),
    prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    }),
  ]);

  const transactions = [
    ...recharges.map((recharge) => ({
      id: recharge.id,
      type: 'credit',
      amount: moneyNumber(recharge.amount),
      status: recharge.status,
      description: 'Recharge',
      reference: recharge.referenceId,
      createdAt: recharge.createdAt,
    })),
    ...withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      type: 'debit',
      amount: moneyNumber(withdrawal.amount),
      status: withdrawal.status,
      description: `Withdraw`,
      reference: withdrawal.upiId,
      createdAt: withdrawal.createdAt,
    })),
  ];

  transactions.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime() ||
      right.id.localeCompare(left.id),
  );

  const items = transactions.slice(skip, skip + pageSize);
  return {
    items,
    pagination: {
      page,
      pageSize,
      hasMore: transactions.length > skip + pageSize,
    },
  };
}
