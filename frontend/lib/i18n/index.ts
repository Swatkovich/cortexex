"use client";

import eng from './eng';
import ru from './ru';
import React from 'react';

export type LangKey = 'eng' | 'ru';

const DICTS: Record<LangKey, Record<string, string>> = {
  eng,
  ru,
};

// Simple translation function (non-reactive). Prefer `useT()` hook in components for reactivity.
export function tStatic(key: string, lang: LangKey = 'eng') {
  return DICTS[lang][key] ?? key;
}

// React context for language
export const LangContext = React.createContext<{ lang: LangKey; setLang: (l: LangKey) => void }>({
  lang: 'eng',
  setLang: () => {},
});

export function useLang() {
  return React.useContext(LangContext);
}

// Hook that returns a translator function bound to current language and re-renders on lang change
export function useT() {
  const { lang } = useLang();
  const t = React.useCallback((key: string) => DICTS[lang][key] ?? key, [lang]);
  return t;
}
