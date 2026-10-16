/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import {
  displayBackgroundPush,
  ensureNotificationChannel,
  handleNotificationEvent,
} from './src/services/pushNotifications';

void ensureNotificationChannel();

messaging().setBackgroundMessageHandler(displayBackgroundPush);
notifee.onBackgroundEvent(handleNotificationEvent);

AppRegistry.registerComponent(appName, () => App);
