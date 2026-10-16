import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { notifyUser } from './notification.service.js';

/**
 * @param {import('@prisma/client').RechargeRequest & { user?: { name: string | null, email: string } }} record
 */
function toRecharge(record) {
  return {
    id: record.id,
    userId: record.userId,
    userName: record.user?.name ?? null,
    userEmail: record.user?.email ?? null,
    amount: record.amount.toString(),
    referenceId: record.referenceId,
    screenshotPath: record.screenshotPath,
    status: record.status,
    createdAt: record.createdAt,
    reviewedAt: record.reviewedAt,
  };
}

/**
 * @param {string} userId
 * @param {{ amount: number, referenceId: string, screenshotPath: string }} input
 */
export async function createRecharge(userId, input) {
  const recharge = await prisma.rechargeRequest.create({
    data: {
      userId,
      amount: input.amount,
      referenceId: input.referenceId,
      screenshotPath: input.screenshotPath,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  return toRecharge(recharge);
}

export async function listRecharges() {
  const records = await prisma.rechargeRequest.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return records
    .map(toRecharge)
    .sort((left, right) => Number(left.status !== 'pending') - Number(right.status !== 'pending'));
}

/**
 * @param {string} userId
 */
export async function getWallet(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });

  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  return { balance: user.walletBalance.toString() };
}

/**
 * @param {string} id
 * @param {'accepted' | 'rejected'} status
 */
async function reviewRecharge(id, status) {
  const current = await prisma.rechargeRequest.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!current) {
    throw new ApiError(404, 'Recharge request not found', 'RECHARGE_NOT_FOUND');
  }

  if (current.status !== 'pending') {
    throw new ApiError(409, 'This recharge has already been reviewed', 'RECHARGE_REVIEWED');
  }

  const reviewed = await prisma.$transaction(async (tx) => {
    const claimed = await tx.rechargeRequest.updateMany({
      where: { id, status: 'pending' },
      data: { status, reviewedAt: new Date() },
    });

    if (claimed.count !== 1) {
      throw new ApiError(409, 'This recharge has already been reviewed', 'RECHARGE_REVIEWED');
    }

    if (status === 'accepted') {
      await tx.user.update({
        where: { id: current.userId },
        data: { walletBalance: { increment: current.amount } },
      });
    }

    const updated = await tx.rechargeRequest.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!updated) {
      throw new ApiError(404, 'Recharge request not found', 'RECHARGE_NOT_FOUND');
    }

    return updated;
  });

  const amount = `₹${current.amount.toString()}`;
  const title = status === 'accepted' ? 'Recharge accepted' : 'Recharge rejected';
  const body =
    status === 'accepted'
      ? `${amount} has been added to your wallet.`
      : `Your recharge of ${amount} was rejected. The amount was not added to your wallet.`;

  try {
    await notifyUser(current.userId, title, body);
  } catch (error) {
    console.error('Recharge notification failed', error);
  }

  return toRecharge(reviewed);
}

export function acceptRecharge(id) {
  return reviewRecharge(id, 'accepted');
}

export function rejectRecharge(id) {
  return reviewRecharge(id, 'rejected');
}
