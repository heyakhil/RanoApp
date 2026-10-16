# Google + Firebase auth setup (Mobile)

## 1. Firebase project

1. Create a Firebase project and enable **Authentication → Sign-in method → Google**.
2. Add an **Android** app with package name `com.ranoapp`.
3. Download `google-services.json` into `Mobile/android/app/google-services.json`.
4. Add a **Web** app in the same Firebase project and copy its **Web client ID**.
5. Put that Web client ID in `Mobile/src/config/env.ts` as `googleWebClientId`.

## 2. Backend service account

1. Firebase Console → Project settings → Service accounts → Generate new private key.
2. Save the JSON as `Backend/firebase-service-account.json` (gitignored).
3. Ensure `Backend/.env` points `FIREBASE_SERVICE_ACCOUNT_PATH` at that file.

## 3. API base URL

- Android emulator → host machine: `http://10.0.2.2:4000/api/v1` (already set in `env.ts`).
- Physical device → use your PC LAN IP, e.g. `http://192.168.1.10:4000/api/v1`.

## 4. Silent JWT refresh

JWT lifetime is **15 minutes**. When an authenticated API returns `401` with code `TOKEN_EXPIRED`, `src/api/client.ts` silently:

1. Asks Firebase for a fresh ID token
2. Calls `POST /auth/refresh`
3. Stores the new JWT
4. Retries the original request once

The UI never shows a re-login prompt for this path.
