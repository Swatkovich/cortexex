'use client';

import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import { themeStore } from '@/store/themeStore';
import { Button, Card } from '@/components/ui';
import DifficultyTag from '@/components/DifficultyTag';
import { authStore } from '@/store/authStore';
import ProfileDiagram from '@/components/ProfileDiagram';
import { useT } from '@/lib/i18n';
import { fetchThemeStats, exportTheme } from '@/lib/api';
import { resolveErrorMessage } from '@/lib/i18n/errorMap';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { PageContainer } from '@/components/layout';

const UserPage = observer(() => {
  const router = useRouter();
  const initialized = authStore.initialized;
  const isAuthenticated = authStore.isAuthenticated;
  const loading = authStore.loading;

  useEffect(() => {
    if (!initialized && !loading) {
      authStore.hydrate();
    }
  }, [initialized, loading]);

  useEffect(() => {
    if (isAuthenticated && !themeStore.initialized && !themeStore.loading) {
      themeStore.fetchThemes();
    }
  }, [isAuthenticated, authStore.user?.name]);

  const [statsMap, setStatsMap] = useState<Record<string, any>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const t = useT();
  const canAccess = useProtectedRoute('/');
  const THEME_ERROR_MAP: Record<string, string> = {
    'Failed to fetch themes': 'themes.error.fetch',
    'Failed to create theme': 'themes.error.create',
    'Failed to update theme': 'themes.error.update',
    'Failed to delete theme': 'themes.error.delete',
    'themes.error.fetch': 'themes.error.fetch',
    'themes.error.create': 'themes.error.create',
    'themes.error.update': 'themes.error.update',
    'themes.error.delete': 'themes.error.delete',
  };

  useEffect(() => {
    // when themes are loaded, fetch stats for each theme
    if (themeStore.initialized && themeStore.themes.length > 0) {
      const ids = themeStore.themes.map((t) => t.id);
      Promise.allSettled(ids.map((id) => fetchThemeStats(id))).then((results) => {
        const map: Record<string, any> = {};
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled' && r.value) {
            map[ids[idx]] = r.value;
          }
        });
        setStatsMap(map);
      });
    }
  }, [themeStore.initialized, themeStore.themes]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId]);

  const handlePlay = () => {
    if (!themeStore.canPlay) {
      return;
    }
    router.push('/game');
  };

  const handleCreateTheme = () => {
    router.push('/createTheme');
  };

  const handleEditTheme = (themeId: string) => {
    router.push(`/createTheme?id=${themeId}`);
  };

  const handleManageQuestions = (themeId: string) => {
    router.push(`/theme/${themeId}/questions`);
  };

  const handleExport = async (themeId: string) => {
    setExporting(true);
    setExportError(null);
    setExportSuccess(false);
    setOpenMenuId(null);
    try {
      const exportData = await exportTheme(themeId);
      // Encode the data as base64 - handle Unicode characters properly
      const jsonString = JSON.stringify(exportData);
      // Convert to UTF-8 bytes, then to base64
      const encodedData = btoa(unescape(encodeURIComponent(jsonString)));
      const shareableUrl = `${window.location.origin}/createTheme?import=${encodeURIComponent(encodedData)}`;

      // Auto-copy to clipboard
      await navigator.clipboard.writeText(shareableUrl);

      // Show success pop-up
      setExportSuccess(true);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'questions.export.error');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    const shouldDelete = window.confirm(t('theme.delete.confirm'));
    if (!shouldDelete) {
      return;
    }
    setDeletingId(themeId);
    setDeleteError(null);
    setOpenMenuId(null);
    try {
      await themeStore.deleteTheme(themeId);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'themes.error.delete');
    } finally {
      setDeletingId(null);
    }
  };

  if (!canAccess || !initialized || loading) {
    return (
      <PageContainer fullHeight centered>
        <p className="text-lg text-light/70">{t('dashboard.loadingThemes')}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer fullHeight>
      <section className="space-y-3">
        <p className="max-w-2xl text-lg text-light/70">{t('dashboard.subtitle')}</p>
      </section>

      <section className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <Button
          onClick={handlePlay}
          disabled={!themeStore.canPlay}
          size="lg"
          className="flex-1 h-auto py-4 text-base sm:h-13 sm:py-0 sm:text-lg"
        >
          {t('dashboard.play')}
        </Button>
        <Button
          variant="outline"
          onClick={handleCreateTheme}
          size="lg"
          className="flex-1 h-auto py-4 text-base sm:h-13 sm:py-0 sm:text-lg"
        >
          {t('dashboard.createTheme')}
        </Button>
      </section>

      {themeStore.loading && !themeStore.initialized ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-lg text-light/70">{t('dashboard.loadingThemes')}</p>
        </div>
      ) : themeStore.error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-red-400">
            {t('generic.errorPrefix')}:{' '}
            {resolveErrorMessage(themeStore.error, THEME_ERROR_MAP, t) ?? themeStore.error}
          </p>
        </div>
      ) : themeStore.themes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-light/20 bg-dark/30 p-12 text-center">
          <p className="text-sm font-medium text-light/50">{t('dashboard.noThemes')}</p>
        </div>
      ) : (
        <>
          {exportSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="relative max-w-md w-full mx-4 p-6 bg-dark border-green-500/30">
                <button
                  onClick={() => setExportSuccess(false)}
                  className="absolute top-4 right-4 p-1 rounded-lg hover:bg-dark/50 transition-colors"
                  aria-label="Close"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="pr-8">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">
                    {t('questions.export.success')}
                  </h3>
                  <p className="text-sm text-light/80">{t('questions.export.shareUrl')}</p>
                </div>
              </Card>
            </div>
          )}

          {exportError && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="relative max-w-md w-full mx-4 p-6 bg-dark border-red-500/30">
                <button
                  onClick={() => setExportError(null)}
                  className="absolute top-4 right-4 p-1 rounded-lg hover:bg-dark/50 transition-colors"
                  aria-label="Close"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="pr-8">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">
                    {t('generic.errorPrefix')}
                  </h3>
                  <p className="text-sm text-light/80">
                    {resolveErrorMessage(exportError, THEME_ERROR_MAP, t) ?? exportError}
                  </p>
                </div>
              </Card>
            </div>
          )}

          {deleteError && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Card className="relative max-w-md w-full mx-4 p-6 bg-dark border-red-500/30">
                <button
                  onClick={() => setDeleteError(null)}
                  className="absolute top-4 right-4 p-1 rounded-lg hover:bg-dark/50 transition-colors"
                  aria-label="Close"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="pr-8">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">
                    {t('generic.errorPrefix')}
                  </h3>
                  <p className="text-sm text-light/80">
                    {resolveErrorMessage(deleteError, THEME_ERROR_MAP, t) ?? deleteError}
                  </p>
                </div>
              </Card>
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-2">
            {themeStore.themes.map((theme) => (
              <Card
                key={theme.id}
                className="group h-full bg-dark-hover/50 p-6 hover:border-light/50"
              >
                <div className="flex h-full flex-col gap-5">
                  {/* Header: info + stats/menu */}
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-6">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <DifficultyTag d={theme.difficulty} />
                        {theme.is_language_topic && (
                          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-blue-200">
                            {t('theme.languageTopicTag')}
                          </span>
                        )}
                      </div>
                      <h2 className="truncate text-xl font-bold text-light">{theme.title}</h2>
                      <p className="truncate text-sm leading-relaxed text-light/70">
                        {theme.description}
                      </p>
                      <p className="text-xs font-medium text-light/50">
                        {theme.questions}{' '}
                        {theme.is_language_topic
                          ? t('theme.languageEntries')
                          : t('theme.questions')}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0 sm:flex-row sm:items-start sm:gap-3">
                      {/* Per-theme diagram */}
                      <ProfileDiagram
                        counts={
                          statsMap[theme.id]?.knowledgeDistribution || {
                            dontKnow: 0,
                            know: 0,
                            wellKnow: 0,
                            perfectlyKnow: 0,
                          }
                        }
                      />

                      {/* Three-dot menu */}
                      <div
                        className="relative"
                        ref={(el) => {
                          menuRefs.current[theme.id] = el;
                        }}
                      >
                        <button
                          onClick={() => setOpenMenuId(openMenuId === theme.id ? null : theme.id)}
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

                        {openMenuId === theme.id && (
                          <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-light/20 bg-dark/90 backdrop-blur-sm shadow-lg z-10 py-2">
                            <button
                              type="button"
                              onClick={() => handleExport(theme.id)}
                              disabled={exporting || deletingId === theme.id}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-light hover:bg-light/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {exporting ? (
                                <svg
                                  className="h-5 w-5 animate-spin text-light/70"
                                  viewBox="0 0 24 24"
                                >
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
                                <Image
                                  src="/file.svg"
                                  alt=""
                                  width={20}
                                  height={20}
                                  className="h-5 w-5 c"
                                />
                              )}
                              <span>{t('questions.export.button')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTheme(theme.id)}
                              disabled={deletingId === theme.id || exporting}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === theme.id ? (
                                <svg
                                  className="h-5 w-5 animate-spin text-red-400"
                                  viewBox="0 0 24 24"
                                >
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
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                    <Button
                      variant={themeStore.isSelected(theme.id) ? 'primary' : 'outline'}
                      onClick={() => themeStore.toggleTheme(theme.id)}
                      className="w-full px-5 py-2.5 text-sm sm:flex-1"
                    >
                      {themeStore.isSelected(theme.id) ? t('theme.selected') : t('theme.select')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEditTheme(theme.id)}
                      className="w-full px-5 py-2.5 text-sm sm:w-auto"
                    >
                      {t('theme.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleManageQuestions(theme.id)}
                      className="w-full px-5 py-2.5 text-sm sm:w-auto"
                    >
                      {t('theme.questions')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>
        </>
      )}
    </PageContainer>
  );
});

export default UserPage;
