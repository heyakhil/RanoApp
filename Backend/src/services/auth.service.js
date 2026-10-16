import { verifyFirebaseIdToken } from './firebase.service.js';
import { issueAccessToken } from './token.service.js';
import {
  completeUserProfile,
  getUserById,
  toPublicUser,
  upsertUserFromFirebase,
} from './user.service.js';

/**
 * Exchanges a Firebase ID token for an app JWT and user payload.
 * @param {string} firebaseIdToken
 */
export async function authenticateWithFirebase(firebaseIdToken) {
  const identity = await verifyFirebaseIdToken(firebaseIdToken);
  const user = await upsertUserFromFirebase(identity);
  const accessToken = issueAccessToken({
    id: user.id,
    email: user.email,
    firebaseUid: user.firebaseUid,
  });

  return {
    accessToken,
    expiresIn: 15 * 60,
    user: toPublicUser(user),
    isProfileComplete: user.isProfileComplete,
  };
}

/**
 * Issues a new JWT from a still-valid Firebase ID token (silent refresh).
 * @param {string} firebaseIdToken
 */
export async function refreshAccessToken(firebaseIdToken) {
  return authenticateWithFirebase(firebaseIdToken);
}

/**
 * @param {string} userId
 * @param {import('./user.service.js').ProfileInput} profile
 */
export async function completeProfile(userId, profile) {
  const user = await completeUserProfile(userId, profile);

  return {
    user: toPublicUser(user),
    isProfileComplete: user.isProfileComplete,
  };
}

/**
 * @param {string} userId
 */
export async function getCurrentUser(userId) {
  const user = await getUserById(userId);

  return {
    user: toPublicUser(user),
    isProfileComplete: user.isProfileComplete,
  };
}
