'use client';

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '@/store/authStore';
import { useT } from '@/lib/i18n';
import { fetchGlobalStats } from '@/lib/api';
import type { GlobalStats } from '@/lib/interface';
import ProfileDiagram from '@/components/ProfileDiagram';
import { ButtonLink } from '@/components/ui';
import { PageContainer } from '@/components/layout';

const HomePage = observer(() => {
  const isAuthenticated = authStore.isAuthenticated;
  const t = useT();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const emptyDistribution = { dontKnow: 0, know: 0, wellKnow: 0, perfectlyKnow: 0 };

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const data = await fetchGlobalStats();
        if (!isMounted) return;
        setStats(data);
        setStatsError(null);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'unknown-error';
        setStatsError(message);
      } finally {
        if (isMounted) {
          setIsStatsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

  const statsItems = stats
    ? [
        { label: t('home.stats.users'), value: stats.totalUsers },
        { label: t('home.stats.themes'), value: stats.totalThemes },
        { label: t('home.stats.questions'), value: stats.totalQuestions },
        { label: t('home.stats.games'), value: stats.totalGamesPlayed },
        { label: t('home.stats.questionsAnswered'), value: stats.totalQuestionsAnswered },
      ]
    : [];
  const distribution = stats?.knowledgeDistribution ?? emptyDistribution;

  return (
    <PageContainer fullHeight className="max-w-4xl items-center text-center">
      <div className="space-y-10">
        <div className="inline-block rounded-full border border-light/20 bg-light/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.4em] text-light/80">
          {t('home.beta')}
        </div>

        <h1 className="text-5xl font-bold leading-tight text-light sm:text-6xl lg:text-7xl">
          {t('home.h1.part1')}
          <br />
          <span className="bg-gradient-to-r from-light to-light/60 bg-clip-text text-transparent">
            {t('home.h1.part2')}
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-light/70 sm:text-xl">
          {t('home.subtitle')}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {isAuthenticated ? (
            <ButtonLink href="/user" size="lg">
              {t('home.getStarted')}
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/auth?type=register" size="lg">
                {t('home.register')}
              </ButtonLink>
              <ButtonLink href="/auth?type=login" variant="outline" size="lg">
                {t('home.login')}
              </ButtonLink>
            </>
          )}
        </div>

        <div className="rounded-3xl border border-light/10 bg-light/5 p-6 text-left shadow-2xl shadow-black/20">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-light/60">
            {t('home.stats.title')}
          </p>
          {isStatsLoading ? (
            <p className="text-sm text-light/70">{t('home.stats.loading')}</p>
          ) : statsError ? (
            <p className="text-sm text-red-300">{t('home.stats.error')}</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {statsItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-light/5 bg-dark/40 p-4 text-center shadow-inner shadow-black/30"
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-light/60">
                      {item.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-light">{formatNumber(item.value)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-2xl border border-light/5 bg-dark/30 p-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-light/60">
                  {t('home.stats.diagramTitle')}
                </p>
                <ProfileDiagram counts={distribution} />
              </div>
            </>
          )}
        </div>
      </div>
      <p className="text-sm text-light/50">{t('home.developing')}</p>
    </PageContainer>
  );
});

export default HomePage;
