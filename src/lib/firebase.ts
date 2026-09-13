import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
// @ts-expect-error getReactNativePersistence ships in @firebase/auth's React Native build
// (resolved by Metro via the "react-native" package.json export condition) but is missing
// from its shared public .d.ts, so plain `tsc` can't see it — known firebase-js-sdk gap.
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { firebaseConfig } from "../../firebaseConfig";

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);

/**
 * The mocked Aadhaar+OTP flow (Master Spec sec. 2) never mints a real auth token, but
 * firestore.rules still needs *some* request.auth to scope access by owner/role. So every
 * device silently signs in with Firebase Anonymous Auth on launch (see FarmerContext) and that
 * uid becomes the farmerId once registration succeeds — this is invisible to the user.
 */
let authInstance: Auth;
if (Platform.OS === "web") {
  authInstance = getAuth(firebaseApp);
} else {
  try {
    authInstance = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if already called once for this app (e.g. Fast Refresh) —
    // fall back to the existing instance rather than crashing.
    authInstance = getAuth(firebaseApp);
  }
}
export const auth = authInstance;
