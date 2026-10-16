import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { notifyUser } from './notification.service.js';

function toWithdrawal(record) {
  return {
    id: record.id,
    userId: record.userId,
    userName: record.user?.name ?? null,
    userEmail: record.user?.email ?? null,
    amount: record.amount.toString(),
    upiId: record.upiId,
    status: record.status,
    createdAt: record.createdAt,
    reviewedAt: record.reviewedAt,
  };
}

export async function listUpiAccounts(userId) {
  return prisma.upiAccount.findMany({
    where: { userId },
    select: { id: true, upiId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createUpiAccount(userId, upiId) {
  try {
    return await prisma.upiAccount.create({
      data: { userId, upiId },
      select: { id: true, upiId: true, createdAt: true },
    });
  } catch (error) {
    if (error?.code !== 'P2002') {
      throw error;
    }
    throw new ApiError(409, 'This UPI ID is already saved', 'UPI_ID_EXISTS');
  }
}

export async function updateUpiAccount(userId, id, upiId) {
  const account = await prisma.upiAccount.findFirst({ where: { id, userId } });
  if (!account) {
    throw new ApiError(404, 'UPI ID not found', 'UPI_ID_NOT_FOUND');
  }

  try {
    return await prisma.upiAccount.update({
      where: { id },
      data: { upiId },
      select: { id: true, upiId: true, createdAt: true },
    });
  } catch (error) {
    if (error?.code !== 'P2002') {
      throw error;
    }
    throw new ApiError(409, 'This UPI ID is already saved', 'UPI_ID_EXISTS');
  }
}

export async function deleteUpiAccount(userId, id) {
  const result = await prisma.upiAccount.deleteMany({ where: { id, userId } });
  if (result.count !== 1) {
    throw new ApiError(404, 'UPI ID not found', 'UPI_ID_NOT_FOUND');
  }
}

export async function createWithdrawal(userId, { amount, upiAccountId }) {
  return prisma.$transaction(async tx => {
    const account = await tx.upiAccount.findFirst({
      where: { id: upiAccountId, userId },
      select: { upiId: true },
    });
    if (!account) {
      throw new ApiError(404, 'Selected UPI ID was not found', 'UPI_ID_NOT_FOUND');
    }

    const debit = await tx.user.updateMany({
      where: { id: userId, walletBalance: { gte: amount } },
      data: { walletBalance: { decrement: amount } },
    });
    if (debit.count !== 1) {
      throw new ApiError(400, 'Insufficient available balance', 'INSUFFICIENT_BALANCE');
    }

    const request = await tx.withdrawalRequest.create({
      data: { userId, amount, upiId: account.upiId },
      include: { user: { select: { name: true, email: true } } },
    });
    return toWithdrawal(request);
  });
}

export async function listWithdrawals() {
  const records = await prisma.withdrawalRequest.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return records
    .map(toWithdrawal)
    .sort((left, right) => Number(left.status !== 'pending') - Number(right.status !== 'pending'));
}

async function reviewWithdrawal(id, status) {
  const current = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!current) {
    throw new ApiError(404, 'Withdrawal request not found', 'WITHDRAWAL_NOT_FOUND');
  }
  if (current.status !== 'pending') {
    throw new ApiError(409, 'This withdrawal has already been reviewed', 'WITHDRAWAL_REVIEWED');
  }

  const reviewed = await prisma.$transaction(async tx => {
    const claimed = await tx.withdrawalRequest.updateMany({
      where: { id, status: 'pending' },
      data: { status, reviewedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw new ApiError(409, 'This withdrawal has already been reviewed', 'WITHDRAWAL_REVIEWED');
    }

    if (status === 'rejected') {
      await tx.user.update({
        where: { id: current.userId },
        data: { walletBalance: { increment: current.amount } },
      });
    }

    const updated = await tx.withdrawalRequest.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!updated) {
      throw new ApiError(404, 'Withdrawal request not found', 'WITHDRAWAL_NOT_FOUND');
    }
    return updated;
  });

  const amount = `₹${current.amount.toString()}`;
  const title = status === 'accepted' ? 'Withdrawal accepted' : 'Withdrawal rejected';
  const body =
    status === 'accepted'
      ? `Your withdrawal of ${amount} to ${current.upiId} has been approved.`
      : `Your withdrawal of ${amount} was rejected. The amount has been returned to your wallet.`;

  try {
    await notifyUser(current.userId, title, body);
  } catch (error) {
    console.error('Withdrawal notification failed', error);
  }

  return toWithdrawal(reviewed);
}

export function acceptWithdrawal(id) {
  return reviewWithdrawal(id, 'accepted');
}

export function rejectWithdrawal(id) {
  return reviewWithdrawal(id, 'rejected');
}
