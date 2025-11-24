"use client"

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import { themeStore } from '@/store/themeStore';
import Button from '@/components/Button';
import DifficultyTag from '@/components/DifficultyTag';
import Card from '@/components/Card';
import { authStore } from '@/store/authStore';
import ProfileDiagram from '@/components/ProfileDiagram';
import { useT } from '@/lib/i18n';
import { fetchThemeStats } from '@/lib/api';

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
  const t = useT();

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

      {themeStore.loading && !themeStore.initialized ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-lg text-light/70">Loading themes...</p>
        </div>
      ) : themeStore.error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-red-400">Error: {themeStore.error}</p>
        </div>
      ) : themeStore.themes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-light/20 bg-dark/30 p-12 text-center">
          <p className="text-sm font-medium text-light/50">
            {t('dashboard.noThemes')}
          </p>
        </div>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2">
          {themeStore.themes.map((theme) => (
            <Card key={theme.id} className="group bg-dark-hover/50 p-6 hover:border-light/50">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <DifficultyTag d={theme.difficulty} />
                    </div>
                    <h2 className="text-xl font-bold text-light">
                      {theme.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-light/70">
                      {theme.description}
                    </p>
                    <p className="text-xs font-medium text-light/50">
                      {theme.questions} {t('theme.questions')}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {/* Per-theme diagram */}
                    <ProfileDiagram counts={statsMap[theme.id]?.knowledgeDistribution || { dontKnow: 0, know: 0, wellKnow: 0, perfectlyKnow: 0 }} />
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
      )}

      <section className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <Button onClick={handlePlay} disabled={!themeStore.canPlay} className="flex-1 px-8 py-4 text-base">{t('dashboard.play')}</Button>
        <Button variant="ghost" onClick={handleCreateTheme} className="flex-1 px-8 py-4 text-base">{t('dashboard.createTheme')}</Button>
      </section>
    </main>
  );
});

export default UserPage;

