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
  const maxForMode = Math.max(
    1,
    isLanguageMode ? languageAvailable || 0 : effectiveAvailable || 0,
  );
  const handleCountChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setCount(Math.max(1, Math.min(value, maxForMode)));
  };
  const showClassicTotals = !isLanguageMode && !hasOnlyLanguageTopics;
  const showIncludeNonStrict = !isLanguageMode && !hasOnlyLanguageTopics;

  return (
    <div className="space-y-8">
      {onBack && (
        <div>
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            className="w-fit"
          >
            {t('questions.backToThemes')}
          </Button>
        </div>
      )}

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light/60">
            {t('game.modeLabel')}
          </p>
          <div className="flex rounded-2xl border border-light/10 bg-dark/30 p-1">
            <button
              type="button"
              onClick={() => setMode('classic')}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                !isLanguageMode
                  ? 'bg-light text-dark shadow-sm'
                  : 'text-light/60 hover:text-light'
              }`}
            >
              {t('game.mode.classic')}
            </button>
            {showLanguageMode && (
              <button
                type="button"
                onClick={() => languageModeEnabled && setMode('language')}
                disabled={!languageModeEnabled}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isLanguageMode
                    ? 'bg-light text-dark shadow-sm'
                    : 'text-light/60 hover:text-light'
                } ${!languageModeEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {t('game.mode.language')}
              </button>
            )}
          </div>
          {isLanguageMode ? (
            <p className="text-sm text-light/60">
              {languageModeEnabled
                ? t('game.mode.languageHint', { count: languageAvailable })
                : t('game.mode.languageRestriction')}
            </p>
          ) : (
            <p className="text-sm text-light/60">
              {t('game.mode.classicHint', { count: effectiveAvailable })}
            </p>
          )}
          {showLanguageMode && (
            <p className="text-xs text-red-300/80">
              {t('game.mode.languageStatsNotice')}
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-light">{t('game.setup.selectedThemes')}{' '}{selected.length > 0 ? `(${selected.length})` : ''}{':'}</label>
          <ul className="mt-2 space-y-2 text-sm text-light/70">
            {selected.map((theme) => (
              <li key={theme.id} className="flex items-center justify-between rounded-md bg-dark/30 py-2">
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

        <div className="space-y-4">
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
          {!isLanguageMode && showClassicTotals && (
            <p className="mt-2 text-xs text-light/50">
              {t('game.setup.totalAvailable')}: {totalAvailable} ({strictAvailable}{' '}
              {t('game.setup.strictLabel')})
              {loading ? ` (${t('game.setup.loading')})` : ''}
            </p>
          )}

          {showIncludeNonStrict ? (
            <div className="mt-4 max-w-md">
              <Checkbox
                checked={includeNonStrict}
                onChange={() => setIncludeNonStrict(!includeNonStrict)}
                label={t('game.setup.includeNonStrict')}
              />
            </div>
          ) : isLanguageMode ? null : null}

          <div className="space-y-3">
            <Checkbox
              checked={blindMode}
              onChange={() => setBlindMode(!blindMode)}
              label={t('game.setup.blindMode.label')}
              description={t('game.setup.blindMode.description')}
            />
          </div>

          <div className="pt-2">
            <Button
              onClick={startGame}
              disabled={isLanguageMode ? languageAvailable === 0 : effectiveAvailable === 0}
              size="fluid"
            >
              {t('game.setup.start')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
 
