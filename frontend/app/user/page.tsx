'use client';

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import { themeStore } from '@/store/themeStore';
import { Button, Card } from '@/components/ui';
import { authStore } from '@/store/authStore';
import { useT } from '@/lib/i18n';
import { fetchThemeStats, exportTheme } from '@/lib/api';
import { resolveErrorMessage } from '@/lib/i18n/errorMap';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { PageContainer } from '@/components/layout';
import { ThemeCard } from '@/components/ThemeCard';

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
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

          <section className="grid gap-6 lg:grid-cols-2 sm:grid-cols-1">
            {themeStore.themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                counts={
                  statsMap[theme.id]?.knowledgeDistribution || {
                    dontKnow: 0,
                    know: 0,
                    wellKnow: 0,
                    perfectlyKnow: 0,
                  }
                }
                isSelected={themeStore.isSelected(theme.id)}
                onToggleSelected={() => themeStore.toggleTheme(theme.id)}
                onEdit={() => handleEditTheme(theme.id)}
                onManageQuestions={() => handleManageQuestions(theme.id)}
                onExport={() => handleExport(theme.id)}
                onDelete={() => handleDeleteTheme(theme.id)}
                exporting={exporting}
                deleting={deletingId === theme.id}
                t={t}
              />
            ))}
          </section>
        </>
      )}
    </PageContainer>
  );
});

export default UserPage;
