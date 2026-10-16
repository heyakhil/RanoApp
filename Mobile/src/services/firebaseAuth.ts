import auth from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { env } from '../config/env';

let configured = false;

export function configureGoogleSignIn(): void {
  if (configured) {
    return;
  }

  if (
    !env.googleWebClientId ||
    env.googleWebClientId.includes('YOUR_WEB_CLIENT_ID')
  ) {
    throw new Error(
      'googleWebClientId is not configured. Set the Firebase Web client ID in src/config/env.ts',
    );
  }

  GoogleSignin.configure({
    webClientId: env.googleWebClientId,
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });

  configured = true;
}

/**
 * Returns a fresh Firebase ID token for the current user.
 * Forces refresh when `forceRefresh` is true (used before silent JWT renewal).
 */
export async function getFirebaseIdToken(
  forceRefresh = false,
): Promise<string> {
  const currentUser = auth().currentUser;

  if (!currentUser) {
    throw new Error('No Firebase user session');
  }

  return currentUser.getIdToken(forceRefresh);
}

async function resolveGoogleIdToken(
  signInIdToken: string | null,
): Promise<string> {
  if (signInIdToken) {
    return signInIdToken;
  }

  const tokens = await GoogleSignin.getTokens();

  if (!tokens.idToken) {
    throw new Error(
      'Google did not return an ID token. Verify the Web client ID and SHA-1 in Firebase.',
    );
  }

  return tokens.idToken;
}

export async function signInWithGoogle(): Promise<string> {
  configureGoogleSignIn();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // Clear any stale Google session so the account picker completes cleanly
  try {
    const previousUser = await GoogleSignin.getCurrentUser();
    if (previousUser) {
      await GoogleSignin.signOut();
    }
  } catch {
    // No previous session
  }

  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    throw new Error('Google sign-in was cancelled');
  }

  const googleIdToken = await resolveGoogleIdToken(response.data.idToken);
  const credential = auth.GoogleAuthProvider.credential(googleIdToken);
  const userCredential = await auth().signInWithCredential(credential);

  return userCredential.user.getIdToken(true);
}

export async function signOutFirebase(): Promise<void> {
  configureGoogleSignIn();

  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignore Google sign-out failures when the user was never signed in locally
  }

  if (auth().currentUser) {
    await auth().signOut();
  }
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
    return true;
  }

  if (
    error instanceof Error &&
    error.message.toLowerCase().includes('cancelled')
  ) {
    return true;
  }

  return false;
}

export function getGoogleSignInErrorMessage(error: unknown): string {
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return 'Google sign-in was cancelled';
      case statusCodes.IN_PROGRESS:
        return 'Google sign-in is already in progress';
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Google Play Services is not available or outdated';
      default:
        break;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Google sign-in failed';
}
