"use client"

import React from 'react';
import TextInput from '@/components/TextInput';
import DifficultyTag from '@/components/DifficultyTag';
import Button from '@/components/Button';
import { useT } from '@/lib/i18n';

type Theme = { id: string; title: string; questions: number; difficulty: string; is_language_topic?: boolean };

export default function GameSetup(props: {
  selected: Theme[];
  count: number;
  setCount: (n: number) => void;
  includeNonStrict: boolean;
  setIncludeNonStrict: (v: boolean) => void;
  blindMode: boolean;
  setBlindMode: (v: boolean) => void;
  effectiveAvailable: number;
  totalAvailable: number;
  strictAvailable: number;
  mode: 'classic' | 'language';
  setMode: (mode: 'classic' | 'language') => void;
  languageModeEnabled: boolean;
  languageAvailable: number;
  loading: boolean;
  startGame: () => void;
  onBack?: () => void;
}) {
  const {
    selected,
    count,
    setCount,
    includeNonStrict,
    setIncludeNonStrict,
    blindMode,
    setBlindMode,
    effectiveAvailable,
    totalAvailable,
    strictAvailable,
    mode,
    setMode,
    languageModeEnabled,
    languageAvailable,
    loading,
    startGame,
    onBack,
  } = props;
  const t = useT();
  const isLanguageMode = mode === 'language';
  const availableDisplay = isLanguageMode ? languageAvailable : effectiveAvailable;
  const maxForMode = Math.max(1, isLanguageMode ? (languageAvailable || 0) : (effectiveAvailable || 0));
  const handleCountChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setCount(Math.max(1, Math.min(value, maxForMode)));
  };

  return (
    <div>
      <div className="mb-4 flex items-start justify-end">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="px-4 py-2 text-sm">{t('action.backToThemes')}</Button>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-light">{t('game.mode.label')}</label>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode('classic')}
            className={`rounded-2xl border px-4 py-4 text-left transition ${mode === 'classic' ? 'border-light/50 bg-dark/60' : 'border-light/20 bg-dark/30 hover:border-light/30'}`}
          >
            <p className="text-base font-semibold text-light">{t('game.mode.classic')}</p>
            <p className="text-xs text-light/60 mt-1">{t('game.mode.classicHint', { count: effectiveAvailable })}</p>
          </button>
          <button
            type="button"
            onClick={() => languageModeEnabled && setMode('language')}
            disabled={!languageModeEnabled}
            className={`rounded-2xl border px-4 py-4 text-left transition ${mode === 'language' ? 'border-blue-400/60 bg-blue-500/10' : 'border-light/20 bg-dark/30 hover:border-light/30'} ${!languageModeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <p className="text-base font-semibold text-light">{t('game.mode.language')}</p>
            <p className={`text-xs mt-1 ${languageModeEnabled ? 'text-light/60' : 'text-red-300'}`}>
              {languageModeEnabled ? t('game.mode.languageHint', { count: languageAvailable }) : t('game.mode.languageRestriction')}
            </p>
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-light">{t('game.setup.selectedThemes')}</label>
          <ul className="mt-2 space-y-2 text-sm text-light/70">
            {selected.map((theme) => (
              <li key={theme.id} className="flex items-center justify-between rounded-md bg-dark/30 px-3 py-2">
                <div>
                  <div className="font-medium text-light">{theme.title}</div>
                    <div className="mt-1 flex items-center gap-3">
                     <div className="text-xs text-light/50">
                       {theme.questions} {theme.is_language_topic ? t('theme.languageEntries') : t('theme.questions')}
                     </div>
                    <div>
                      <DifficultyTag d={theme.difficulty} />
                    </div>
                    {theme.is_language_topic && (
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-blue-200">
                        {t('theme.languageTopicTag')}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-light">{t('game.setup.questionsPerSession')}</label>
          <div className="mt-6 flex gap-3">
            <TextInput
              type="number"
              min={1}
              max={maxForMode}
              value={count}
              onChange={(e) => handleCountChange(Number(e.target.value))}
              className="w-32"
            />
            <div className="text-sm text-light/50">
              {count}/{availableDisplay}
            </div>
          </div>
          {isLanguageMode ? (
            <p className="mt-2 text-xs text-light/50">
              {t('game.mode.languageHint', { count: languageAvailable })}
            </p>
          ) : (
            <p className="mt-2 text-xs text-light/50">
              {t('game.setup.totalAvailable')}: {totalAvailable} ({strictAvailable} {t('game.setup.strictLabel')})
              {loading ? ` (${t('game.setup.loading')})` : ''}
            </p>
          )}

          {!isLanguageMode ? (
            <div className="mt-4">
              <label className="inline-flex items-center gap-2 text-sm text-light/80">
                <input
                  type="checkbox"
                  checked={includeNonStrict}
                  onChange={() => setIncludeNonStrict(!includeNonStrict)}
                  className="h-4 w-4"
                />
                <span className="text-light">{t('game.setup.includeNonStrict')}</span>
              </label>
            </div>
          ) : (
            <p className="mt-4 text-xs text-light/50">
              {t('game.mode.languageStrict')}
            </p>
          )}

          <div className="mt-4">
            <label className="inline-flex items-center gap-2 text-sm text-light/80">
              <input
                type="checkbox"
                checked={blindMode}
                onChange={() => setBlindMode(!blindMode)}
                className="h-4 w-4"
              />
              <span className="text-light">{t('game.setup.blindMode.label')}</span>
            </label>
            <p className="mt-1 text-xs text-light/50">{t('game.setup.blindMode.description')}</p>
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              onClick={startGame}
              disabled={isLanguageMode ? languageAvailable === 0 : effectiveAvailable === 0}
              className="px-6 py-3 text-base"
            >
              {t('game.setup.start')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
