"use client"

import React from 'react';
import TextInput from '@/components/TextInput';
import DifficultyTag from '@/components/DifficultyTag';
import Button from '@/components/Button';

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

  return (
    <div>
      <div className="mb-4 flex items-start justify-end">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="px-4 py-2 text-sm">Back to Themes</Button>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-light">Selected Themes</label>
          <ul className="mt-2 space-y-2 text-sm text-light/70">
            {selected.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-md bg-dark/30 px-3 py-2">
                <div>
                  <div className="font-medium text-light">{t.title}</div>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="text-xs text-light/50">{t.questions} questions</div>
                    <div>
                      <DifficultyTag d={t.difficulty} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-light">Questions per session</label>
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
          <p className="mt-2 text-xs text-light/50">Total available questions: {totalAvailable} ({strictAvailable} strict){loading ? ' (loading...)' : ''}</p>

          <div className="mt-4">
            <label className="inline-flex items-center gap-2 text-sm text-light/80">
              <input
                type="checkbox"
                checked={includeNonStrict}
                onChange={() => setIncludeNonStrict(!includeNonStrict)}
                className="h-4 w-4"
              />
              <span className="text-light">Include non-strict questions</span>
            </label>
          </div>

          <div className="mt-4 flex gap-3">
            <Button onClick={startGame} disabled={effectiveAvailable === 0} className="px-6 py-3 text-base">Start</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
