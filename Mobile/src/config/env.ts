export const env = {
  /**
   * Android emulator → host machine. On a physical device, use your PC LAN IP
   * e.g. http://192.168.1.10:4000/api/v1
   */
  apiBaseUrl: 'http://192.168.29.211:4000/api/v1',
  isDev: __DEV__,
  /**
   * Firebase / Google Cloud Web client ID (client_type: 3).
   * Required for Google Sign-In to return an idToken on Android.
   */
  googleWebClientId:
    '979849513501-582afh0f5c0qj74pr2e1nbn8fujjsogg.apps.googleusercontent.com',
  apiTimeoutMs: 15000,
} as const;
