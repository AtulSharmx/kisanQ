import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "../../firebaseConfig";

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
