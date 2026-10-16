import { getFirebaseAuth } from '../config/firebase.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * @typedef {Object} FirebaseIdentity
 * @property {string} uid
 * @property {string} email
 * @property {string | null} name
 * @property {string | null} picture
 * @property {boolean} emailVerified
 */

/**
 * Verifies a Firebase ID token from the client.
 * @param {string} idToken
 * @returns {Promise<FirebaseIdentity>}
 */
export async function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new ApiError(401, 'Firebase ID token is required', 'FIREBASE_TOKEN_MISSING');
  }

  try {
    const decoded = await getFirebaseAuth().verifyIdToken(idToken);

    if (!decoded.email) {
      throw new ApiError(
        401,
        'Firebase account must have an email address',
        'FIREBASE_EMAIL_MISSING',
      );
    }

    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
      emailVerified: Boolean(decoded.email_verified),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      401,
      'Invalid or expired Firebase token',
      'FIREBASE_TOKEN_INVALID',
    );
  }
}
