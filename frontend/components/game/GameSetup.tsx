"use client"

import React from 'react';
import DifficultyTag from '@/components/DifficultyTag';
import { Button, Checkbox, FormField, Input } from '@/components/ui';
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
  showLanguageMode: boolean;
  hasOnlyLanguageTopics: boolean;
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
    showLanguageMode,
    hasOnlyLanguageTopics,
    loading,
    startGame,
    onBack,
  } = props;
  const t = useT();
  const isLanguageMode = mode === 'language';
  const maxForMode = Math.max(1, isLanguageMode ? (languageAvailable || 0) : (effectiveAvailable || 0));
  const modeGridCols = showLanguageMode ? 'sm:grid-cols-2' : 'sm:grid-cols-1';
  const handleCountChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setCount(Math.max(1, Math.min(value, maxForMode)));
  };
  const showClassicTotals = !isLanguageMode && !hasOnlyLanguageTopics;
  const showIncludeNonStrict = !isLanguageMode && !hasOnlyLanguageTopics;

  return (
    <div>
      <div className="mb-4 flex items-start justify-end">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            {t('action.backToThemes')}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-light">{t('game.mode.label')}</label>
        <div className={`mt-2 grid gap-3 grid-cols-1 ${modeGridCols}`}>
          <button
            type="button"
            onClick={() => setMode('classic')}
            className={`rounded-2xl border px-4 py-4 text-left transition ${mode === 'classic' ? 'border-light/50 bg-dark/60' : 'border-light/20 bg-dark/30 hover:border-light/30'}`}
          >
            <p className="text-base font-semibold text-light">{t('game.mode.classic')}</p>
            <p className="text-xs text-light/60 mt-1">{t('game.mode.classicHint', { count: effectiveAvailable })}</p>
          </button>
          {showLanguageMode && (
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
              {languageModeEnabled && (
                <p className="text-[11px] mt-2 text-blue-100/70">
                  {t('game.mode.languageStatsNotice')}
                </p>
              )}
            </button>
          )}
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
          <FormField label={t('game.setup.questionsPerSession')} htmlFor="questionsPerSession" required>
            <Input
              id="questionsPerSession"
              type="number"
              min={1}
              max={maxForMode}
              value={count}
              onChange={(e) => handleCountChange(Number(e.target.value))}
              className="w-32"
            />
          </FormField>
          {isLanguageMode ? (
            <p className="mt-2 text-xs text-light/50">
              {t('game.mode.languageHint', { count: languageAvailable })}
            </p>
          ) : showClassicTotals ? (
            <p className="mt-2 text-xs text-light/50">
              {t('game.setup.totalAvailable')}: {totalAvailable} ({strictAvailable} {t('game.setup.strictLabel')})
              {loading ? ` (${t('game.setup.loading')})` : ''}
            </p>
          ) : null}

          {showIncludeNonStrict ? (
            <div className="mt-4 max-w-md">
              <Checkbox
                checked={includeNonStrict}
                onChange={() => setIncludeNonStrict(!includeNonStrict)}
                label={t('game.setup.includeNonStrict')}
              />
            </div>
          ) : isLanguageMode ? (
            <p className="mt-4 text-xs text-light/50">
              {t('game.mode.languageStrict')}
            </p>
          ) : null}

          <div className="mt-4">
            <Checkbox
              checked={blindMode}
              onChange={() => setBlindMode(!blindMode)}
              label={t('game.setup.blindMode.label')}
              description={t('game.setup.blindMode.description')}
            />
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              onClick={startGame}
              disabled={isLanguageMode ? languageAvailable === 0 : effectiveAvailable === 0}
              size="lg"
            >
              {t('game.setup.start')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
