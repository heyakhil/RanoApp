import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * @typedef {Object} ProfileInput
 * @property {string} name
 * @property {string} mobile
 * @property {string | Date} dob
 * @property {'male' | 'female' | 'other' | 'prefer_not_to_say'} gender
 */

/**
 * @param {{ name?: string | null, mobile?: string | null, dob?: Date | null, gender?: string | null }} user
 * @returns {boolean}
 */
function isProfileReady(user) {
  return Boolean(user.name && user.mobile && user.dob && user.gender);
}

/**
 * Finds a user by id or throws 404.
 * @param {string} userId
 */
export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  return user;
}

/**
 * Creates or updates a user from a verified Firebase identity.
 * @param {{ uid: string, email: string, name: string | null, picture: string | null }} identity
 */
export async function upsertUserFromFirebase(identity) {
  const existing = await prisma.user.findUnique({
    where: { firebaseUid: identity.uid },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        email: identity.email,
        photoUrl: identity.picture ?? existing.photoUrl,
        lastLoginAt: new Date(),
        name: existing.name ?? identity.name,
      },
    });
  }

  return prisma.user.create({
    data: {
      firebaseUid: identity.uid,
      email: identity.email,
      photoUrl: identity.picture,
      name: identity.name,
      lastLoginAt: new Date(),
      isProfileComplete: false,
    },
  });
}

/**
 * Saves profile fields collected after first Google registration.
 * @param {string} userId
 * @param {ProfileInput} profile
 */
export async function completeUserProfile(userId, profile) {
  await getUserById(userId);

  const data = {
    name: profile.name.trim(),
    mobile: profile.mobile.trim(),
    dob: new Date(profile.dob),
    gender: profile.gender,
  };

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      isProfileComplete: isProfileReady(data),
    },
  });
}

/**
 * Serializes a Prisma user record for API responses.
 * @param {import('@prisma/client').User} user
 */
export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    mobile: user.mobile,
    dob: user.dob,
    gender: user.gender,
    photoUrl: user.photoUrl,
    isProfileComplete: user.isProfileComplete,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
