"use client";

import eng from './eng';
import ru from './ru';
import React from 'react';

export type LangKey = 'eng' | 'ru';

const DICTS: Record<LangKey, Record<string, string>> = {
  eng,
  ru,
};

type TranslationParams = Record<string, string | number>;

function interpolate(template: string, params?: TranslationParams) {
  if (!params) return template;
  return Object.entries(params).reduce((acc, [key, value]) => {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    return acc.replace(pattern, String(value));
  }, template);
}

// Simple translation function (non-reactive). Prefer `useT()` hook in components for reactivity.
export function tStatic(key: string, lang: LangKey = 'eng', params?: TranslationParams) {
  const template = DICTS[lang][key] ?? key;
  return interpolate(template, params);
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
  const t = React.useCallback(
    (key: string, params?: TranslationParams) => {
      const template = DICTS[lang][key] ?? key;
      return interpolate(template, params);
    },
    [lang],
  );
  return t;
}
