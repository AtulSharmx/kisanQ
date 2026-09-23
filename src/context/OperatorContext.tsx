import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { COLLECTIONS } from "../types/firestore";
import type { Staff, StaffSession } from "../types/firestore";
import { hashPin } from "../services/pinAuth";
import { useLanguage } from "./LanguageContext";

interface OperatorContextValue {
  session: StaffSession | null;
  staffName: string | null;
  initializing: boolean;
  loginError: string | null;
  loggingIn: boolean;
  login: (staffId: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const OperatorContext = createContext<OperatorContextValue | null>(null);

/**
 * Staff (operator/admin) session — Missing Details Polish sec. 5: staff ID + PIN, set up by an
 * admin, not Aadhaar-based. See the identity-model comment in firestore.rules for how this
 * anonymous-auth-backed session actually gets enforced server-side.
 */
export function OperatorProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [uid, setUid] = useState<string | null>(null);
  const [session, setSession] = useState<StaffSession | null>(null);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        await signInAnonymously(auth).catch((err) => {
          console.error("Anonymous sign-in failed — is Anonymous auth enabled in the Firebase console?", err);
        });
        return;
      }
      setUid(user.uid);
      const existing = await getDoc(doc(db, COLLECTIONS.staffSessions, user.uid)).catch(() => null);
      if (existing?.exists()) {
        const s = existing.data() as StaffSession;
        setSession(s);
        const staffDoc = await getDoc(doc(db, COLLECTIONS.staff, s.staffId)).catch(() => null);
        if (staffDoc?.exists()) setStaffName((staffDoc.data() as Staff).name);
      }
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (staffId: string, pin: string) => {
    if (!uid) return;
    setLoggingIn(true);
    setLoginError(null);
    try {
      const staffSnap = await getDoc(doc(db, COLLECTIONS.staff, staffId.trim()));
      if (!staffSnap.exists()) {
        setLoginError(t("staffIdNotFound"));
        return;
      }
      const staff = staffSnap.data() as Staff;
      const hashed = await hashPin(pin);
      if (hashed !== staff.pinHash) {
        setLoginError(t("incorrectPin"));
        return;
      }
      const newSession: StaffSession = {
        staffId: staffId.trim(),
        role: staff.role,
        assignedCentreId: staff.assignedCentreId,
      };
      await setDoc(doc(db, COLLECTIONS.staffSessions, uid), newSession);
      setSession(newSession);
      setStaffName(staff.name);
    } catch (e) {
      console.error(e);
      setLoginError(t("loginFailedCheckConnection"));
    } finally {
      setLoggingIn(false);
    }
  }, [uid, t]);

  const logout = useCallback(async () => {
    if (!uid) return;
    await deleteDoc(doc(db, COLLECTIONS.staffSessions, uid)).catch(() => {});
    setSession(null);
    setStaffName(null);
  }, [uid]);

  const value = useMemo(
    () => ({ session, staffName, initializing, loginError, loggingIn, login, logout }),
    [session, staffName, initializing, loginError, loggingIn, login, logout]
  );

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator(): OperatorContextValue {
  const ctx = useContext(OperatorContext);
  if (!ctx) throw new Error("useOperator must be used within an OperatorProvider");
  return ctx;
}
