"use client"

import { useT } from '@/lib/i18n';
import React from 'react';

export default function ProfileDiagram({ counts }: { counts: { dontKnow: number; know: number; wellKnow: number; perfectlyKnow: number } }) {
  const { dontKnow, know, wellKnow, perfectlyKnow } = counts;
  const total = dontKnow + know + wellKnow + perfectlyKnow;
  const t = useT();

  const size = 128;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const makeDash = (count: number) => (total === 0 ? 0 : (count / total) * circumference);
  const dashGray = makeDash(dontKnow);
  const dashOrange = makeDash(know);
  const dashYellow = makeDash(wellKnow);
  const dashGreen = makeDash(perfectlyKnow);

  let cumulative = 0;
  const segment = (dash: number, color: string, key: string) => {
    if (dash <= 0) return null;
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
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle r={radius} cx={size / 2} cy={size / 2} fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
            {segment(dashGray, '#9CA3AF', 'gray')}
            {segment(dashOrange, '#fb923c', 'orange')}
            {segment(dashYellow, '#fbbf24', 'yellow')}
            {segment(dashGreen, '#34d399', 'green')}
          </g>
        </svg>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-dark/50 flex items-center justify-center text-sm font-semibold text-light">
          {total === 0 ? '—' : `${Math.round(((perfectlyKnow) / Math.max(1, total)) * 100)}%`}
        </div>
      </div>

      <div className="text-sm text-light/70">
        <div className="mb-1"><span className="inline-block w-3 h-3 rounded-full bg-gray-400 mr-2 align-middle" />{t('diagram.dont')}:  {dontKnow}</div>
        <div className="mb-1"><span className="inline-block w-3 h-3 rounded-full bg-orange-400 mr-2 align-middle" />{t('diagram.know')}: {know}</div>
        <div className="mb-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-300 mr-2 align-middle" />{t('diagram.well')}: {wellKnow}</div>
        <div><span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-2 align-middle" />{t('diagram.perfectly')}: {perfectlyKnow}</div>
      </div>
    </div>
  );
}
