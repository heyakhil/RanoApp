import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '../types/auth';

const ACCESS_TOKEN_KEY = '@rano/access_token';
const USER_KEY = '@rano/user';

export async function saveSession(
  accessToken: string,
  user: AuthUser,
): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, USER_KEY]);
}
