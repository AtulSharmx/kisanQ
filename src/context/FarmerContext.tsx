import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInAnonymously, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getFarmer } from "../services/firestoreService";
import type { Farmer } from "../types/firestore";

interface FarmerContextValue {
  /** Firebase Auth uid for this device — becomes the farmerId once registration completes. */
  farmerId: string | null;
  /** The farmers/{farmerId} doc, once registration has completed. Null until then. */
  farmer: Farmer | null;
  /** True while the initial anonymous sign-in / farmer lookup is in flight. */
  initializing: boolean;
  /** Call after registerFarmer() succeeds so the rest of the app sees the profile immediately. */
  setFarmer: (farmer: Farmer) => void;
  /**
   * Signs out of the current anonymous session (Missing Details Polish sec. 5: "mobile+OTP is
   * only needed again after an explicit logout"). onAuthStateChanged's existing `if (!user)`
   * branch immediately starts a *new* anonymous session, so the next registration gets a fresh
   * uid/farmerId — clearing farmer/farmerId here right away (rather than waiting on that round
   * trip) avoids a flash of the old farmer's data before it resolves.
   */
  logout: () => Promise<void>;
}

const FarmerContext = createContext<FarmerContextValue | null>(null);

export function FarmerProvider({ children }: { children: React.ReactNode }) {
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [farmer, setFarmerState] = useState<Farmer | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Missing Details Polish sec. 5: the farmer stays "logged in" device-to-device via
        // this anonymous session — mobile+OTP is only needed again after an explicit logout.
        await signInAnonymously(auth).catch((err) => {
          console.error("Anonymous sign-in failed — is Anonymous auth enabled in the Firebase console?", err);
        });
        return;
      }
      setFarmerId(user.uid);
      const existing = await getFarmer(user.uid).catch(() => null);
      setFarmerState(existing);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setFarmerId(null);
    setFarmerState(null);
  }, []);

  const value = useMemo(
    () => ({ farmerId, farmer, initializing, setFarmer: setFarmerState, logout }),
    [farmerId, farmer, initializing, logout]
  );

  return <FarmerContext.Provider value={value}>{children}</FarmerContext.Provider>;
}

export function useFarmer(): FarmerContextValue {
  const ctx = useContext(FarmerContext);
  if (!ctx) throw new Error("useFarmer must be used within a FarmerProvider");
  return ctx;
}
