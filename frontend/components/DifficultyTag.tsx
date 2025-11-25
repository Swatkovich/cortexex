"use client"

import React from 'react';
import { useT } from '@/lib/i18n';

export default function DifficultyTag({ d }: { d: string }) {
  const base = 'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider';
  const t = useT();
  const labels: Record<string, string> = {
    'Easy': t('createTheme.diff.easy'),
    'Medium': t('createTheme.diff.medium'),
    'Hard': t('createTheme.diff.hard'),
  };

  if (d === 'Easy') return <span className={`${base} border border-green-500/20 bg-green-500/10 text-green-400`}>{labels.Easy}</span>;
  if (d === 'Medium') return <span className={`${base} border border-yellow-500/20 bg-yellow-500/10 text-yellow-400`}>{labels.Medium}</span>;
  if (d === 'Hard') return <span className={`${base} border border-red-500/20 bg-red-500/10 text-red-400`}>{labels.Hard}</span>;
  return <span className={`${base} border border-light/20 bg-light/5 text-light/60`}>{d}</span>;
}
