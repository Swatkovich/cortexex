'use client';

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import { themeStore } from '@/store/themeStore';
import { Button, Toast } from '@/components/ui';
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
            <Toast
              variant="success"
              onClose={() => setExportSuccess(false)}
              title={t('questions.export.success')}
              message={t('questions.export.shareUrl')}
            />
          )}

          {exportError && (
            <Toast
              variant="error"
              onClose={() => setExportError(null)}
              title={t('generic.errorPrefix')}
              message={resolveErrorMessage(exportError, THEME_ERROR_MAP, t) ?? exportError}
            />
          )}

          {deleteError && (
            <Toast
              variant="error"
              onClose={() => setDeleteError(null)}
              title={t('generic.errorPrefix')}
              message={resolveErrorMessage(deleteError, THEME_ERROR_MAP, t) ?? deleteError}
            />
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
