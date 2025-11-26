"use client"

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui';
import CircularDiagram from '@/components/CircularDiagram';
import { Question } from '@/lib/interface';
import { useT } from '@/lib/i18n';

export default function ResultsView(props: {
  questions: Question[];
  userAnswers: Record<string, { answer: string | string[] | null; isCorrect: boolean | null }>;
  themeTitles: string[];
  onRestart: () => void;
  onBack: () => void;
  onCopyResult: (type: 'success' | 'error', message: string) => void;
}) {
  const { questions, userAnswers, themeTitles, onRestart, onBack, onCopyResult } = props;
  const t = useT();
  const diagramRef = useRef<HTMLDivElement | null>(null);
  const [copyingDiagram, setCopyingDiagram] = useState(false);

  const handleCopyDiagram = async () => {
    if (!diagramRef.current || copyingDiagram) return;
    try {
      setCopyingDiagram(true);
      const { toBlob } = await import('html-to-image');
      const node = diagramRef.current;
      const blob = await toBlob(node, {
        backgroundColor: '#0f1115',
        pixelRatio: 2,
        style: {
          padding: '24px',
          borderRadius: '24px',
        },
      });
      if (!blob) throw new Error('Failed to render diagram');
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      onCopyResult('success', t('game.results.copyDiagram.success'));
    } catch (error) {
      console.error('copy diagram error', error);
      onCopyResult('error', t('game.results.copyDiagram.error'));
    } finally {
      setCopyingDiagram(false);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex-1">
            <div
              ref={diagramRef}
              className="inline-flex flex-col gap-4 rounded-2xl border border-light/10 bg-linear-to-br from-light-dark to-light/10 p-6"
            >
              <CircularDiagram questions={questions} userAnswers={userAnswers} />
              <div>
                <h2 className="text-xl font-bold text-light">{t('game.results.title')}</h2>
                {themeTitles.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-light/80 mb-1">{t('game.results.themesPlayed')}:</p>
                    <ul className="text-sm text-light/60 space-y-1">
                      {themeTitles.map((title, idx) => (
                        <li key={idx}>{idx + 1}) {title}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-light/60 mt-2">{t('game.results.noThemes')}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-shrink-0">
            <Button variant="outline" size="fluid" onClick={handleCopyDiagram} isLoading={copyingDiagram}>
              {t('game.results.copyDiagram')}
            </Button>
            <Button onClick={onRestart} size="fluid">
              {t('game.results.restart')}
            </Button>
            <Button variant="outline" size="fluid" onClick={onBack}>
              {t('action.backToThemes')}
            </Button>
          </div>
        </div>
      <div className="space-y-3">
        {questions.map((q, i) => {
          const ua = userAnswers[q.id];
          return (
            <div key={q.id} className="rounded-2xl border border-light/10 bg-dark/30 p-4">
              <div className="font-medium text-light">{i + 1}. {q.question_text}</div>
              {q.question_hint && (
                <div className="text-xs text-light/60 mt-1">{q.question_hint}</div>
              )}
              <div className="text-xs text-light/50 mt-1">{t('game.results.yourAnswer')}: {Array.isArray(ua?.answer) ? ua?.answer.join(', ') : ua?.answer ?? '—'}</div>
              {q.answer && (
                <div className="text-xs text-light/50 mt-1">{t('game.results.correctAnswer')}: {q.answer}</div>
              )}
              {q.correct_options && q.correct_options.length > 0 && (
                <div className="text-xs text-light/50 mt-1">{t('game.results.correctOptions')}: {q.correct_options.join(', ')}</div>
              )}
              <div
                className={`mt-2 text-sm ${ua?.isCorrect === true
                    ? q.is_strict
                      ? 'text-green-400' // strict + correct
                      : 'text-yellow-400' // non-strict + correct
                    : ua?.isCorrect === false
                      ? 'text-red-400' // incorrect
                      : 'text-light/60' // unanswered
                  }`}
              >
                {ua?.isCorrect === true
                  ? q.is_strict
                    ? t('game.results.status.correct')
                    : t('game.results.status.nonStrict')
                  : ua?.isCorrect === false
                    ? t('game.results.status.incorrect')
                    : t('game.results.status.recorded')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
