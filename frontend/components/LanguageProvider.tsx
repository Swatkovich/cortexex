"use client";

import React, { useEffect, useState } from 'react';
import { LangContext, type LangKey } from '@/lib/i18n';

const STORAGE_KEY = 'cortexex_lang';

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Use a stable default on the server; switch to stored language only after mount.
  const [lang, setLang] = useState<LangKey>('eng');
  const [ready, setReady] = useState(false);

  // After mount, read persisted language and mark provider as ready.
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === 'ru' || v === 'eng') {
        setLang(v as LangKey);
      }
    } catch {
      // ignore storage errors
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang, ready]);

  if (!ready) {
    // Avoid language flicker by not rendering children until language is resolved client-side.
    return null;
  }

  return (
    <LangContext.Provider value={{ lang, setLang: (l: LangKey) => setLang(l) }}>
      {children}
    </LangContext.Provider>
  );
}
