"use client";

import React, { useEffect, useState } from 'react';
import { LangContext, type LangKey } from '@/lib/i18n';

const STORAGE_KEY = 'cortexex_lang';

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Initialize to a stable default so server-render and initial client render match.
  // Read persisted language from localStorage only after mount to avoid hydration mismatch.
  const [lang, setLang] = useState<LangKey>('eng');

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'ru' || v === 'eng') setLang(v as LangKey);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang: (l: LangKey) => setLang(l) }}>
      {children}
    </LangContext.Provider>
  );
}
