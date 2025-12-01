'use client';

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
  strictCount?: number;
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
  strictCount,
}: ThemeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDiagramTooltip, setShowDiagramTooltip] = useState(false);
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

  useEffect(() => {
    if (!showDiagramTooltip) {
      return;
    }
    const timeoutId = window.setTimeout(() => setShowDiagramTooltip(false), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [showDiagramTooltip]);

  return (
    <Card
      className="group relative h-full cursor-pointer bg-dark-hover/50 p-3 hover:border-light/50 sm:p-5 lg:p-6"
      onClick={onToggleSelected}
    >
      {/* Three-dot menu in top-right corner */}
      <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((open) => !open);
          }}
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
          <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-light/20 bg-dark/90 py-2 shadow-lg backdrop-blur-sm sm:w-56">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExportClick();
              }}
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
                <svg
                  className="h-5 w-5 text-light/80"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <path
                    d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z"
                    clipRule="evenodd"
                    fillRule="evenodd"
                  />
                </svg>
              )}
              <span>{t('questions.export.button')}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick();
              }}
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

      <div className="flex h-full flex-col gap-4 sm:gap-5">
        {/* Top row: tags (left) + menu (right) */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
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
          <h2 className="break-words text-base font-bold text-light sm:text-lg lg:text-xl">
            {theme.title}
          </h2>
          <p className="text-xs leading-relaxed text-light/70 sm:text-sm">{theme.description}</p>
          <div className="space-y-1 text-[0.7rem] font-medium text-light/60 sm:text-xs">
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
                <span className="text-light/60">
                  {' '}
                  ({t('theme.questions.strict')}:{' '}
                  <span className="font-semibold text-light/80">
                    {strictCount ?? theme.strict_questions ?? 0}
                  </span>)
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Diagram centered */}
        <div className="mt-auto flex flex-col items-center justify-center gap-3 py-1 sm:flex-row sm:gap-4 sm:py-2">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDiagramTooltip((prev) => !prev);
              }}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-light/20 bg-dark/60 text-xs font-semibold text-light/80 transition hover:border-light/40 hover:text-light sm:h-8 sm:w-8 sm:text-sm"
              aria-label={t('profile.knowledgeDistribution.description')}
            >
              ?
            </button>
            {showDiagramTooltip && (
              <div className="absolute left-1/2 top-full z-20 mt-2 w-60 -translate-x-1/2 rounded-xl border border-light/15 bg-dark/90 p-3 text-xs text-light/80 shadow-lg sm:left-full sm:top-1/2 sm:mt-0 sm:ml-3 sm:-translate-x-0 sm:-translate-y-1/2">
                {t('profile.knowledgeDistribution.description')}
              </div>
            )}
          </div>
          <ProfileDiagram counts={counts} />
        </div>

        {/* Actions at bottom */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelected();
            }}
            className={`w-full px-4 py-2 text-xs sm:flex-1 sm:px-5 sm:py-2.5 sm:text-sm ${
              isSelected
                ? 'bg-green-500/40 text-white hover:bg-green-500/40 border-green-500/30'
                : ''
            }`}
          >
            {isSelected ? t('theme.selected') : t('theme.select')}
          </Button>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="w-full px-4 py-2 text-xs sm:w-auto sm:px-5 sm:py-2.5 sm:text-sm"
          >
            {t('theme.edit')}
          </Button>
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onManageQuestions();
            }}
            className="w-full px-4 py-2 text-xs sm:w-auto sm:px-5 sm:py-2.5 sm:text-sm bg-light/20 text-light hover:bg-light/40"
          >
            {t('theme.add')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

