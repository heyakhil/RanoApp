import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { env } from './env.js';

let initialized = false;

/**
 * Initializes Firebase Admin SDK once using the service account file.
 * @returns {typeof admin}
 */
export function initFirebase() {
  if (initialized) {
    return admin;
  }

  const absolutePath = path.isAbsolute(env.firebaseServiceAccountPath)
    ? env.firebaseServiceAccountPath
    : path.resolve(process.cwd(), env.firebaseServiceAccountPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Firebase service account file not found at: ${absolutePath}`,
    );
  }

  const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
  return admin;
}

/**
 * @returns {admin.auth.Auth}
 */
export function getFirebaseAuth() {
  if (!initialized) {
    initFirebase();
  }

  return admin.auth();
}

/**
 * @returns {admin.messaging.Messaging}
 */
export function getFirebaseMessaging() {
  if (!initialized) {
    initFirebase();
  }

  return admin.messaging();
}
