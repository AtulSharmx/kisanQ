/**
 * Firebase config, read from environment variables (see .env.example).
 * Expo inlines any variable prefixed EXPO_PUBLIC_ into the JS bundle at build time —
 * see https://docs.expo.dev/versions/v57.0.0/guides/environment-variables/
 *
 * Never hardcode real Firebase config values here or commit a filled-in .env.
 */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
] as const;

export function assertFirebaseConfig(): void {
  const missing = requiredKeys.filter((key) => !firebaseConfig[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase config values: ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill in your Firebase project's config."
    );
  }
}
