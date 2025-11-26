"use client"

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui';
import CircularDiagram from '@/components/CircularDiagram';
import { Question } from '@/lib/interface';
import { useT } from '@/lib/i18n';

export default function ResultsView(props: {
  questions: Question[];
  userAnswers: Record<string, { answer: string | string[] | null; isCorrect: boolean | null }>;
  onRestart: () => void;
  onBack: () => void;
}) {
  const { questions, userAnswers, onRestart, onBack } = props;
  const correct = Object.values(userAnswers).filter(a => a.isCorrect === true).length;
  const t = useT();
  const percent = Math.round((correct / Math.max(1, questions.length)) * 100);
  const diagramRef = useRef<HTMLDivElement | null>(null);
  const [copyingDiagram, setCopyingDiagram] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');

  const handleCopyDiagram = async () => {
    if (!diagramRef.current || copyingDiagram) return;
    try {
      setCopyingDiagram(true);
      setCopyState('idle');
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
      setCopyState('success');
    } catch (error) {
      console.error('copy diagram error', error);
      setCopyState('error');
    } finally {
      setCopyingDiagram(false);
      setTimeout(() => setCopyState('idle'), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex-1">
          <div
            ref={diagramRef}
            className="inline-flex flex-col gap-4 rounded-2xl border border-light/10 bg-gradient-to-br from-dark-hover/70 to-dark/40 p-6"
          >
            <CircularDiagram questions={questions} userAnswers={userAnswers} />
            <div>
              <h2 className="text-xl font-bold text-light">{t('game.results.title')}</h2>
              <p className="text-sm text-light/60">
                {t('game.results.summary.answered')} {correct}{' '}
                {t('game.results.summary.outOf')} {questions.length} ({percent}%)
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-shrink-0">
          <Button variant="outline" size="fluid" onClick={handleCopyDiagram} isLoading={copyingDiagram}>
            {t('game.results.copyDiagram')}
          </Button>
          {copyState === 'success' && (
            <p className="text-xs text-green-400">{t('game.results.copyDiagram.success')}</p>
          )}
          {copyState === 'error' && (
            <p className="text-xs text-red-400">{t('game.results.copyDiagram.error')}</p>
          )}
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
