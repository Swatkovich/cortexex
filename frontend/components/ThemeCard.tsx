'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Theme } from '@/store/themeStore';
import DifficultyTag from '@/components/DifficultyTag';
import ProfileDiagram from '@/components/ProfileDiagram';
import { Card, Button } from '@/components/ui';

type KnowledgeCounts = {
  dontKnow: number;
  know: number;
  wellKnow: number;
  perfectlyKnow: number;
};

type ThemeCardProps = {
  theme: Theme;
  counts: KnowledgeCounts;
  isSelected: boolean;
  onToggleSelected: () => void;
  onEdit: () => void;
  onManageQuestions: () => void;
  onExport: () => void;
  onDelete: () => void;
  exporting: boolean;
  deleting: boolean;
  t: (key: string) => string;
};

export function ThemeCard({
  theme,
  counts,
  isSelected,
  onToggleSelected,
  onEdit,
  onManageQuestions,
  onExport,
  onDelete,
  exporting,
  deleting,
  t,
}: ThemeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleExportClick = () => {
    setMenuOpen(false);
    onExport();
  };

  const handleDeleteClick = () => {
    setMenuOpen(false);
    onDelete();
  };

  return (
    <Card className="group relative h-full bg-dark-hover/50 p-6 hover:border-light/50">
      {/* Three-dot menu in top-right corner */}
      <div className="absolute right-4 top-4 z-10" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="p-2 rounded-lg bg-transparent text-light border border-light/20 hover:border-light/40 hover:bg-light/5 transition-colors"
          aria-label="Theme options"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-light/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-light/20 bg-dark/90 backdrop-blur-sm shadow-lg py-2">
            <button
              type="button"
              onClick={handleExportClick}
              disabled={exporting || deleting}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-light hover:bg-light/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <svg className="h-5 w-5 animate-spin text-light/70" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
                  ></path>
                </svg>
              ) : (
                <Image src="/file.svg" alt="" width={20} height={20} className="h-5 w-5" />
              )}
              <span>{t('questions.export.button')}</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleting || exporting}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <svg className="h-5 w-5 animate-spin text-red-400" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
                  ></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-3h4m-4 0a1 1 0 00-1 1v1h6V5a1 1 0 00-1-1m-4 0h4"
                  />
                </svg>
              )}
              <span>{t('theme.delete')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex h-full flex-col gap-5">
        {/* Top row: tags (left) + menu (right) */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyTag d={theme.difficulty} />
            {theme.is_language_topic && (
              <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border border-blue-500/20 bg-blue-500/10 text-blue-200">
                {t('theme.languageTopicTag')}
              </span>
            )}
          </div>
        </div>

        {/* Title, description, counts */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-light break-words">{theme.title}</h2>
          <p className="truncate text-sm leading-relaxed text-light/70">{theme.description}</p>
          <div className="space-y-1 text-xs font-medium text-light/50">
            {theme.is_language_topic ? (
              <p>
                {t('theme.languageEntries')}:{' '}
                <span className="font-semibold text-light/80">
                  {theme.language_entries_count ?? 0}
                </span>
              </p>
            ) : (
              <p>
                {t('theme.questions')}:{' '}
                <span className="font-semibold text-light/80">{theme.questions}</span>
              </p>
            )}
          </div>
        </div>

        {/* Diagram centered */}
        <div className="flex justify-left py-2">
          <ProfileDiagram counts={counts} />
        </div>

        {/* Actions at bottom */}
        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <Button
            variant="outline"
            onClick={onToggleSelected}
            className={`w-full px-5 py-2.5 text-sm sm:flex-1 ${
              isSelected
                ? 'bg-green-500/40 text-white hover:bg-green-500/40 border-green-500/30'
                : ''
            }`}
          >
            {isSelected ? t('theme.selected') : t('theme.select')}
          </Button>
          <Button
            variant="outline"
            onClick={onEdit}
            className="w-full px-5 py-2.5 text-sm sm:w-auto"
          >
            {t('theme.edit')}
          </Button>
          <Button
            variant="ghost"
            onClick={onManageQuestions}
            className="w-full px-5 py-2.5 text-sm sm:w-auto bg-light/20 text-light hover:bg-light/40"
          >
            {t('theme.add')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

