"use client"

import React from 'react';
import { Question } from '@/lib/interface';

type AnswersMap = Record<string, { answer: string | string[] | null; isCorrect: boolean | null }>;

export default function CircularDiagram({ questions, userAnswers }: { questions: Question[]; userAnswers: AnswersMap }) {
  const green = questions.filter((q) => q.is_strict && userAnswers[q.id]?.isCorrect === true).length;
  const red = questions.filter((q) => q.is_strict && userAnswers[q.id]?.isCorrect !== true).length;
  const yellow = questions.filter((q) => !q.is_strict).length;
  const total = green + red + yellow;

  const size = 96;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const makeDash = (count: number) => (total === 0 ? 0 : (count / total) * circumference);
  const dashG = makeDash(green);
  const dashR = makeDash(red);
  const dashY = makeDash(yellow);

  let cumulative = 0;
  const segment = (dash: number, color: string, key: string) => {
    const dashArray = `${dash} ${Math.max(0, circumference - dash)}`;
    const offset = circumference - cumulative;
    cumulative += dash;
    return (
      <circle
        key={key}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        fill="transparent"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={dashArray}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    );
  };

  return (
    <div className="flex items-center gap-6">
      <div style={{ width: size, height: size, position: 'relative' }} className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>{/* background track */}
            <circle r={radius} cx={size / 2} cy={size / 2} fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
            {segment(dashG, '#34d399', 'g')}
            {segment(dashR, '#f87171', 'r')}
            {segment(dashY, '#fbbf24', 'y')}
          </g>
        </svg>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-dark/50 flex items-center justify-center text-sm font-semibold text-light">
          {total === 0 ? '—' : `${Math.round(((green + yellow) / Math.max(1, total)) * 100)}%`}
        </div>
      </div>

      <div className="text-sm text-light/70">
        <div className="mb-1"><span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-2 align-middle" />Strict correct: {green}</div>
        <div className="mb-1"><span className="inline-block w-3 h-3 rounded-full bg-red-400 mr-2 align-middle" />Strict incorrect: {red}</div>
        <div><span className="inline-block w-3 h-3 rounded-full bg-yellow-300 mr-2 align-middle" />Non-strict: {yellow}</div>
      </div>
    </div>
  );
}
