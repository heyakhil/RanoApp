import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  completeProfile as completeProfileRequest,
  exchangeFirebaseToken,
  fetchCurrentUser,
} from '../api/authApi';
import {
  getGoogleSignInErrorMessage,
  isGoogleSignInCancelled,
  signInWithGoogle,
  signOutFirebase,
} from '../services/firebaseAuth';

import {
  listenForTokenRefresh,
  syncPushToken,
} from '../services/pushNotifications';
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  saveSession,
} from '../services/tokenStorage';
import type { AuthUser, CompleteProfilePayload } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isBootstrapping: boolean;
  isSubmitting: boolean;
  error: string | null;
  signInWithGoogleAccount: () => Promise<boolean>;
  completeProfile: (payload: CompleteProfilePayload) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [token, storedUser] = await Promise.all([
          getAccessToken(),
          getStoredUser(),
        ]);

        if (!token || !storedUser) {
          return;
        }

        setUser(storedUser);
        void syncPushToken().catch(() => undefined);

        // Soft revalidate; silent JWT refresh happens inside the API client
        const me = await fetchCurrentUser();
        const latestToken = (await getAccessToken()) ?? token;
        setUser(me.user);
        await saveSession(latestToken, me.user);
      } catch {
        await clearSession();
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    return listenForTokenRefresh();
  }, [user]);

  const signInWithGoogleAccount = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const firebaseIdToken = await signInWithGoogle();
      const session = await exchangeFirebaseToken(firebaseIdToken);
      await saveSession(session.accessToken, session.user);
      setUser(session.user);
      void syncPushToken().catch(() => undefined);
      return true;
    } catch (err) {
      if (isGoogleSignInCancelled(err)) {
        return false;
      }

      setError(getGoogleSignInErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const completeProfile = useCallback(
    async (payload: CompleteProfilePayload): Promise<boolean> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const result = await completeProfileRequest(payload);
        const token = await getAccessToken();

        if (token) {
          await saveSession(token, result.user);
        }

        setUser(result.user);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not save profile';
        setError(message);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setIsSubmitting(true);

    try {
      await signOutFirebase();
    } finally {
      await clearSession();
      setUser(null);
      setIsSubmitting(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isProfileComplete: Boolean(user?.isProfileComplete),
      isBootstrapping,
      isSubmitting,
      error,
      signInWithGoogleAccount,
      completeProfile,
      logout,
      clearError,
    }),
    [
      user,
      isBootstrapping,
      isSubmitting,
      error,
      signInWithGoogleAccount,
      completeProfile,
      logout,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
