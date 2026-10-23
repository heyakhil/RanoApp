import { createRequire } from 'node:module';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const webPush = createRequire(import.meta.url)('web-push');

const ADMIN_SUBJECT_PREFIX = 'admin:';

/**
 * @param {string} subject
 * @returns {string}
 */
function adminAccountId(subject) {
  if (typeof subject !== 'string' || !subject.startsWith(ADMIN_SUBJECT_PREFIX)) {
    throw new ApiError(403, 'Admin access is required', 'ADMIN_REQUIRED');
  }

  return subject.slice(ADMIN_SUBJECT_PREFIX.length);
}

export function getAdminPushPublicKey() {
  if (!env.vapidPublicKey || !env.vapidPrivateKey) return null;
  return env.vapidPublicKey;
}

function configureWebPush() {
  const publicKey = getAdminPushPublicKey();
  if (!publicKey) return false;

  webPush.setVapidDetails(env.vapidSubject, publicKey, env.vapidPrivateKey);
  return true;
}

/**
 * @param {string} subject
 * @param {{ endpoint: string, keys: { p256dh: string, auth: string } }} subscription
 */
export async function saveAdminPushSubscription(subject, subscription) {
  const adminId = adminAccountId(subject);
  const account = await prisma.adminAccount.findUnique({
    where: { id: adminId },
    select: { id: true },
  });

  if (!account) {
    throw new ApiError(404, 'Admin account not found', 'ADMIN_NOT_FOUND');
  }

  await prisma.adminPushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      adminId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      adminId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

/**
 * @param {string} subject
 * @param {string} endpoint
 */
export async function removeAdminPushSubscription(subject, endpoint) {
  const adminId = adminAccountId(subject);
  await prisma.adminPushSubscription.deleteMany({
    where: { adminId, endpoint },
  });
}

/**
 * Sends a browser push for a new recharge. Failures stay inside this function
 * so submitting a recharge never depends on push delivery.
 * @param {{ id: string, amount: string, userName: string | null, userEmail: string | null }} recharge
 */
export async function notifyAdminsOfRecharge(recharge) {
  if (!configureWebPush()) {
    console.error('Admin browser push is not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.');
    return;
  }

  const subscriptions = await prisma.adminPushSubscription.findMany({
    select: { endpoint: true, p256dh: true, auth: true },
  });

  if (subscriptions.length === 0) return;

  const name = recharge.userName || recharge.userEmail || 'A user';
  const payload = JSON.stringify({
    title: 'New recharge request',
    body: `${name} requested ₹${recharge.amount}`,
    tag: `recharge-${recharge.id}`,
    url: '/dashboard/recharge',
  });

  const staleEndpoints = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          { TTL: 60 * 60, urgency: 'high' },
        );
      } catch (error) {
        const statusCode = error?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(subscription.endpoint);
          return;
        }

        console.error('Unable to send an admin recharge push.', error);
      }
    }),
  );

  if (staleEndpoints.length > 0) {
    await prisma.adminPushSubscription.deleteMany({
      where: { endpoint: { in: staleEndpoints } },
    });
  }
}
