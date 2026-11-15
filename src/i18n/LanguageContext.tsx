import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppLanguage } from '../types';
import { TRANSLATIONS, type TranslationDictionary } from './translations';
import { fetchUserPreferences, saveUserPreferences } from '../services/apiService';

const LANG_STORAGE_KEY = 'carecircle_lang';
const LANG_CHOSEN_KEY = 'carecircle_lang_chosen';

interface LanguageContextValue {
  lang: AppLanguage;
  hasChosenLanguage: boolean;
  t: TranslationDictionary;
  setLang: (next: AppLanguage) => void;
  chooseInitialLanguage: (next: AppLanguage) => void;
  syncAccountLanguage: (uid: string | null) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): AppLanguage {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY);
    return raw === 'hi' ? 'hi' : 'en';
  } catch {
    return 'en';
  }
}

function readHasChosenLanguage(): boolean {
  try {
    return localStorage.getItem(LANG_CHOSEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(readStoredLanguage);
  const [hasChosenLanguage, setHasChosenLanguage] = useState<boolean>(readHasChosenLanguage);
  const activeUidRef = useRef<string | null>(null);
  const explicitPreLoginChoiceRef = useRef<boolean>(false);
  const langRef = useRef<AppLanguage>(lang);
  langRef.current = lang;

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      // Ignore SSR or non-DOM contexts
    }
  }, [lang]);

  const persistLocal = useCallback((next: AppLanguage, chosen = true) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
      if (chosen) {
        localStorage.setItem(LANG_CHOSEN_KEY, '1');
      }
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const setLang = useCallback(
    (next: AppLanguage) => {
      langRef.current = next;
      setLangState(next);
      setHasChosenLanguage(true);
      persistLocal(next, true);
      if (activeUidRef.current) {
        void saveUserPreferences({ preferredLanguage: next }).catch(() => {
          // Local storage remains up to date if offline
        });
      } else {
        explicitPreLoginChoiceRef.current = true;
      }
    },
    [persistLocal]
  );

  const chooseInitialLanguage = useCallback(
    (next: AppLanguage) => {
      explicitPreLoginChoiceRef.current = true;
      langRef.current = next;
      setLangState(next);
      setHasChosenLanguage(true);
      persistLocal(next, true);
    },
    [persistLocal]
  );

  const syncAccountLanguage = useCallback(
    async (uid: string | null) => {
      activeUidRef.current = uid;
      if (!uid) return;

      try {
        const prefs = await fetchUserPreferences();
        if (explicitPreLoginChoiceRef.current) {
          explicitPreLoginChoiceRef.current = false;
          await saveUserPreferences({ preferredLanguage: langRef.current });
          return;
        }
        if (prefs.preferredLanguage === 'en' || prefs.preferredLanguage === 'hi') {
          langRef.current = prefs.preferredLanguage;
          setLangState(prefs.preferredLanguage);
          setHasChosenLanguage(true);
          persistLocal(prefs.preferredLanguage, true);
        } else {
          await saveUserPreferences({ preferredLanguage: langRef.current });
        }
      } catch {
        // Ignore network errors and preserve local selection
      }
    },
    [persistLocal]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      hasChosenLanguage,
      t: TRANSLATIONS[lang],
      setLang,
      chooseInitialLanguage,
      syncAccountLanguage,
    }),
    [lang, hasChosenLanguage, setLang, chooseInitialLanguage, syncAccountLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
