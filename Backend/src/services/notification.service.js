import { getFirebaseMessaging } from '../config/firebase.js';
import { prisma } from '../config/prisma.js';

/**
 * Saves the device token used for recharge review notifications.
 * @param {string} userId
 * @param {string} token
 */
export async function saveDeviceToken(userId, token) {
  await prisma.deviceToken.upsert({
    where: { token },
    update: { userId },
    create: { userId, token },
  });
}

/**
 * Sends a push notification to every device registered for the user.
 * Missing or invalid tokens do not fail the recharge review.
 * @param {string} userId
 * @param {string} title
 * @param {string} body
 */
export async function notifyUser(userId, title, body) {
  const devices = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });

  if (devices.length === 0) {
    return;
  }

  const response = await getFirebaseMessaging().sendEachForMulticast({
    tokens: devices.map((device) => device.token),
    notification: { title, body },
    data: { title, body },
  });

  const invalidTokens = response.responses.flatMap((result, index) => {
    const code = result.error?.code;
    if (
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/registration-token-not-registered'
    ) {
      return [devices[index].token];
    }

    return [];
  });

  if (invalidTokens.length > 0) {
    await prisma.deviceToken.deleteMany({
      where: { token: { in: invalidTokens } },
    });
  }
}
