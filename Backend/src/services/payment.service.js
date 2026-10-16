import { prisma } from '../config/prisma.js';

const DESTINATION_ID = 'default';

function toDestination(record) {
  return {
    upiId: record?.upiId ?? '',
    qrImageUrl: record?.qrImageUrl ?? '',
  };
}

export async function getPaymentDestination() {
  const record = await prisma.paymentDestination.findUnique({
    where: { id: DESTINATION_ID },
  });

  return toDestination(record);
}

export async function savePaymentDestination(upiId, qrImageUrl) {
  const record = await prisma.paymentDestination.upsert({
    where: { id: DESTINATION_ID },
    create: {
      id: DESTINATION_ID,
      upiId,
      qrImageUrl: qrImageUrl ?? '',
    },
    update: {
      upiId,
      ...(qrImageUrl ? { qrImageUrl } : {}),
    },
  });

  return toDestination(record);
}
