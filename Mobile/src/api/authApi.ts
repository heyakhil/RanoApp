import type {
  AuthSession,
  AuthUser,
  CompleteProfilePayload,
} from '../types/auth';
import { apiClient } from './client';

interface AuthSessionResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
  isProfileComplete: boolean;
}

interface ProfileResponse {
  user: AuthUser;
  isProfileComplete: boolean;
}

interface MeResponse {
  user: AuthUser;
  isProfileComplete: boolean;
}

export async function exchangeFirebaseToken(
  idToken: string,
): Promise<AuthSession> {
  const response = await apiClient.postPublic<AuthSessionResponse>(
    '/auth/google',
    { idToken },
  );

  if (!response.success || !response.data) {
    throw new Error(response.message ?? 'Google login failed');
  }

  return response.data;
}

export async function refreshAccessToken(
  idToken: string,
): Promise<AuthSession> {
  const response = await apiClient.postPublic<AuthSessionResponse>(
    '/auth/refresh',
    { idToken },
  );

  if (!response.success || !response.data) {
    throw new Error(response.message ?? 'Token refresh failed');
  }

  return response.data;
}

export async function completeProfile(
  payload: CompleteProfilePayload,
): Promise<ProfileResponse> {
  const response = await apiClient.post<ProfileResponse>(
    '/auth/complete-profile',
    payload,
  );

  if (!response.success || !response.data) {
    throw new Error(response.message ?? 'Failed to save profile');
  }

  return response.data;
}

export async function fetchCurrentUser(): Promise<MeResponse> {
  const response = await apiClient.get<MeResponse>('/auth/me');

  if (!response.success || !response.data) {
    throw new Error(response.message ?? 'Failed to load profile');
  }

  return response.data;
}
