"use client"

import { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import { themeStore } from '@/store/themeStore';
import Button from '@/components/Button';
import DifficultyTag from '@/components/DifficultyTag';
import Card from '@/components/Card';
import { authStore } from '@/store/authStore';
import ProfileDiagram from '@/components/ProfileDiagram';
import { useT } from '@/lib/i18n';
import { fetchThemeStats, exportTheme } from '@/lib/api';
import { resolveErrorMessage } from '@/lib/i18n/errorMap';

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
    if (initialized && !isAuthenticated) {
      router.replace('/auth?type=login');
    }
  }, [initialized, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && !themeStore.initialized && !themeStore.loading) {
      themeStore.fetchThemes();
    }
  }, [isAuthenticated]);

  const [statsMap, setStatsMap] = useState<Record<string, any>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const t = useT();
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
      const ids = themeStore.themes.map(t => t.id);
      Promise.allSettled(ids.map(id => fetchThemeStats(id))).then(results => {
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

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark">
        <p className="text-lg text-light/70">{t('dashboard.loadingThemes')}</p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-12 px-6 py-12 sm:px-8 lg:px-12">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-light/60">
          {t('dashboard.title')}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-light sm:text-5xl">
          {t('dashboard.title')}
        </h1>
        <p className="max-w-2xl text-lg text-light/70">
          {t('dashboard.subtitle')}
        </p>
      </section>

      <section className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <Button onClick={handlePlay} disabled={!themeStore.canPlay} className="flex-1 px-8 py-4 text-base">{t('dashboard.play')}</Button>
        <Button variant="ghost" onClick={handleCreateTheme} className="flex-1 px-8 py-4 text-base">{t('dashboard.createTheme')}</Button>
      </section>

      {themeStore.loading && !themeStore.initialized ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-lg text-light/70">{t('dashboard.loadingThemes')}</p>
        </div>
      ) : themeStore.error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-red-400">
            {t('generic.errorPrefix')}: {resolveErrorMessage(themeStore.error, THEME_ERROR_MAP, t) ?? themeStore.error}
          </p>
        </div>
      ) : themeStore.themes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-light/20 bg-dark/30 p-12 text-center">
          <p className="text-sm font-medium text-light/50">
            {t('dashboard.noThemes')}
          </p>
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
                  <h3 className="text-lg font-semibold text-green-400 mb-2">{t('questions.export.success')}</h3>
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
                  <h3 className="text-lg font-semibold text-red-400 mb-2">{t('generic.errorPrefix')}</h3>
                  <p className="text-sm text-light/80">{resolveErrorMessage(exportError, THEME_ERROR_MAP, t) ?? exportError}</p>
                </div>
              </Card>
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-2">
            {themeStore.themes.map((theme) => (
              <Card key={theme.id} className="group bg-dark-hover/50 p-6 hover:border-light/50">
                <div className="flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <DifficultyTag d={theme.difficulty} />
                        {theme.is_language_topic && (
                          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-blue-200">
                            {t('theme.languageTopicTag')}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-light">
                        {theme.title}
                      </h2>
                      <p className="text-sm leading-relaxed text-light/70">
                        {theme.description}
                      </p>
                      <p className="text-xs font-medium text-light/50">
                        {theme.questions} {theme.is_language_topic ? t('theme.languageEntries') : t('theme.questions')}
                      </p>
                    </div>

                    <div className="flex items-start gap-3 shrink-0">
                      {/* Per-theme diagram */}
                      <ProfileDiagram counts={statsMap[theme.id]?.knowledgeDistribution || { dontKnow: 0, know: 0, wellKnow: 0, perfectlyKnow: 0 }} />
                      
                      {/* Three-dot menu */}
                      <div className="relative" ref={(el) => { menuRefs.current[theme.id] = el; }}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === theme.id ? null : theme.id)}
                          className="p-2 rounded-lg hover:bg-dark/50 transition-colors"
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
                          <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-light/20 bg-dark/90 backdrop-blur-sm shadow-lg z-10">
                            <button
                              onClick={() => handleExport(theme.id)}
                              disabled={exporting}
                              className="w-full px-4 py-2 text-left text-sm text-light hover:bg-dark/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {exporting ? t('questions.loading') : t('questions.export.button')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant={themeStore.isSelected(theme.id) ? 'primary' : 'ghost'}
                      onClick={() => themeStore.toggleTheme(theme.id)}
                      className="flex-1 px-5 py-2.5 text-sm"
                    >
                      {themeStore.isSelected(theme.id) ? t('theme.selected') : t('theme.select')}
                    </Button>
                    <Button variant="ghost" onClick={() => handleEditTheme(theme.id)} className="px-5 py-2.5 text-sm">{t('theme.edit')}</Button>
                    <Button variant="ghost" onClick={() => handleManageQuestions(theme.id)} className="px-5 py-2.5 text-sm">{t('theme.questions')}</Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>
        </>
      )}

    </main>
  );
});

export default UserPage;

