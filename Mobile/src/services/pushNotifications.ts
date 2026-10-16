import { Platform } from 'react-native';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  EventType,
  type Event,
} from '@notifee/react-native';
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { registerDeviceToken } from '../api/rechargeApi';

const CHANNEL_ID = 'rano-updates';

interface PushContent {
  title: string;
  body: string;
}

function readText(value: string | object | undefined): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readRemoteMessage(
  message: FirebaseMessagingTypes.RemoteMessage,
): PushContent | null {
  const title =
    readText(message.notification?.title) ?? readText(message.data?.title);
  const body =
    readText(message.notification?.body) ?? readText(message.data?.body);

  if (!title || !body) {
    return null;
  }

  return { title, body };
}

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Wallet updates',
    importance: AndroidImportance.HIGH,
  });
}

export async function displayPush(content: PushContent): Promise<void> {
  await ensureNotificationChannel();
  await notifee.displayNotification({
    title: content.title,
    body: content.body,
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
    },
  });
}

export async function displayRemoteMessage(
  message: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  const content = readRemoteMessage(message);
  if (!content) {
    return;
  }

  await displayPush(content);
}

export function listenForForegroundPush(): () => void {
  const unsubscribeMessage = messaging().onMessage(async (message) => {
    await displayRemoteMessage(message);
  });
  const unsubscribePress = notifee.onForegroundEvent((event) => {
    void handleNotificationEvent(event);
  });

  return () => {
    unsubscribeMessage();
    unsubscribePress();
  };
}

export async function displayBackgroundPush(
  message: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  if (message.notification) {
    return;
  }

  await displayRemoteMessage(message);
}

export async function handleNotificationEvent(event: Event): Promise<void> {
  const notificationId = event.detail.notification?.id;
  if (event.type === EventType.PRESS && notificationId) {
    await notifee.cancelNotification(notificationId);
  }
}

export function listenForTokenRefresh(): () => void {
  return messaging().onTokenRefresh((token) => {
    void registerDeviceToken(token).catch(() => undefined);
  });
}

export async function syncPushToken(): Promise<void> {
  await ensureNotificationChannel();

  const settings = await notifee.requestPermission();
  const allowed =
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

  if (!allowed) {
    return;
  }

  const token = await messaging().getToken();
  if (!token) {
    return;
  }

  await registerDeviceToken(token);
}
