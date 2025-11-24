"use client"

import React from 'react';
import Button from '@/components/Button';
import CircularDiagram from '@/components/CircularDiagram';
import { Question } from '@/lib/interface';
import { useRouter } from 'next/navigation';

export default function ResultsView(props: {
  questions: Question[];
  userAnswers: Record<string, { answer: string | string[] | null; isCorrect: boolean | null }>;
  onRestart: () => void;
  onBack: () => void;
}) {
  const { questions, userAnswers, onRestart, onBack } = props;
  const correct = Object.values(userAnswers).filter(a => a.isCorrect === true).length;

  return (
    <div className="space-y-4 rounded-2xl border border-light/10 bg-dark/50 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <CircularDiagram questions={questions} userAnswers={userAnswers} />
          <h2 className="text-2xl font-bold text-light">Results</h2>
          <p className="text-sm text-light/60">You answered {correct} correct out of {questions.length} ({Math.round((correct / Math.max(1, questions.length)) * 100)}%)</p>
        </div>
        <div className="ml-6 flex-shrink-0 flex flex-col items-end gap-3">
          <Button onClick={onRestart} className="px-6 py-3 text-base">Restart Game</Button>
          <Button variant="ghost" onClick={onBack} className="px-6 py-3 text-base">Back to Themes</Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {questions.map((q, i) => {
          const ua = userAnswers[q.id];
          return (
            <div key={q.id} className="rounded-md border border-light/10 bg-dark/30 p-3">
              <div className="font-medium text-light">{i + 1}. {q.question_text}</div>
              <div className="text-xs text-light/50 mt-1">Your answer: {Array.isArray(ua?.answer) ? ua?.answer.join(', ') : ua?.answer ?? '—'}</div>
              {q.answer && (
                <div className="text-xs text-light/50 mt-1">Correct answer: {q.answer}</div>
              )}
              {q.correct_options && q.correct_options.length > 0 && (
                <div className="text-xs text-light/50 mt-1">Correct options: {q.correct_options.join(', ')}</div>
              )}
              <div
  className={`mt-2 text-sm ${
    ua?.isCorrect === true
      ? q.is_strict
        ? 'text-green-400'  // strict + correct
        : 'text-yellow-400' // non-strict + correct
      : ua?.isCorrect === false
        ? 'text-red-400'    // incorrect
        : 'text-light/60'   // unanswered
  }`}
>
  {ua?.isCorrect === true
    ? q.is_strict
      ? 'Correct'
      : 'Non-strict'
    : ua?.isCorrect === false
      ? 'Incorrect'
      : 'Recorded'}
</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
