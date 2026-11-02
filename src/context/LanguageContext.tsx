import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Lang, StringKey } from "../i18n/strings";
import { LANGS, t as translate } from "../i18n/strings";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "kisanq.lang";

function isLang(value: string | null): value is Lang {
  return value != null && (LANGS as readonly string[]).includes(value);
}

/**
 * Hindi is the default language (docs/KisanQ_UIUX_Spec.md principle 6), and the farmer's choice
 * is remembered across restarts.
 *
 * Persisting it is not a nicety: language is the very first screen precisely because the app is
 * for farmers who may not read English or Hindi, and before this the choice lived in component
 * state alone — so a Punjabi or Tamil farmer re-picked their language every single time they
 * opened the app, after being dropped onto a Hindi screen to find the setting. AsyncStorage is
 * already a dependency (it backs Firebase auth persistence in src/lib/firebase.ts) and works on
 * the web build too, so the operator/admin portal remembers its language the same way.
 *
 * Children are held back until the stored value has been read — one local read, typically a few
 * milliseconds — rather than rendering Hindi first and snapping to the real language a frame
 * later. If the read fails (or storage is unavailable), it falls through to the Hindi default
 * instead of leaving the app blank.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("hi");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (isLang(stored)) setLangState(stored);
      })
      .catch((err) => console.error("Could not read the saved language", err))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fire-and-forget write: the UI switches language immediately and must never wait on (or fail
  // because of) storage — a language that didn't persist is a far smaller problem than a
  // language button that appears dead.
  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch((err) =>
      console.error("Could not save the language choice", err)
    );
  }, []);

  const t = useCallback((key: StringKey) => translate(key, lang), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  if (!ready) return null;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
