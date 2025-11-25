"use client"

import React from 'react';
import TextInput from '@/components/TextInput';
import DifficultyTag from '@/components/DifficultyTag';
import Button from '@/components/Button';
import { useT } from '@/lib/i18n';

type Theme = { id: string; title: string; questions: number; difficulty: string };

export default function GameSetup(props: {
  selected: Theme[];
  count: number;
  setCount: (n: number) => void;
  includeNonStrict: boolean;
  setIncludeNonStrict: (v: boolean) => void;
  effectiveAvailable: number;
  totalAvailable: number;
  strictAvailable: number;
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
    effectiveAvailable,
    totalAvailable,
    strictAvailable,
    loading,
    startGame,
    onBack,
  } = props;
  const t = useT();

  return (
    <div>
      <div className="mb-4 flex items-start justify-end">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="px-4 py-2 text-sm">{t('action.backToThemes')}</Button>
        )}
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
                    <div className="text-xs text-light/50">{theme.questions} {t('theme.questions')}</div>
                    <div>
                      <DifficultyTag d={theme.difficulty} />
                    </div>
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
              max={effectiveAvailable}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-32"
            />
            <div className="text-sm text-light/50">{count}/{effectiveAvailable}</div>
          </div>
          <p className="mt-2 text-xs text-light/50">
            {t('game.setup.totalAvailable')}: {totalAvailable} ({strictAvailable} {t('game.setup.strictLabel')})
            {loading ? ` (${t('game.setup.loading')})` : ''}
          </p>

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

          <div className="mt-4 flex gap-3">
            <Button onClick={startGame} disabled={effectiveAvailable === 0} className="px-6 py-3 text-base">{t('game.setup.start')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
