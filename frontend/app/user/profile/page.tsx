'use client';

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ButtonLink } from '@/components/ui';
import { authStore } from '@/store/authStore';
import { fetchProfileStats } from '@/lib/api';
import ProfileDiagram from '@/components/ProfileDiagram';
import { useT } from '@/lib/i18n';
import { resolveErrorMessage } from '@/lib/i18n/errorMap';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { PageContainer } from '@/components/layout';

const ProfilePage = observer(() => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const t = useT();
  const canAccess = useProtectedRoute('/');
  const ERROR_MAP: Record<string, string> = {
    'Failed to load profile stats': 'profile.error.failed',
    'Failed to load profile': 'profile.error.failed',
    'profile.error.failed': 'profile.error.failed',
  };

  useEffect(() => {
    if (!authStore.initialized && !authStore.loading) {
      authStore.hydrate();
    }
  }, [authStore.initialized, authStore.loading]);

  useEffect(() => {
    // Wait for auth to be initialized and authenticated before loading profile stats
    if (!authStore.initialized || !authStore.isAuthenticated) {
      setLoading(true);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const data = await fetchProfileStats();
        setStats(data);
      } catch (err: any) {
        setError(err?.message || 'profile.error.failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [authStore.initialized, authStore.isAuthenticated]);

  if (!canAccess || loading) {
    return (
      <PageContainer fullHeight centered className="max-w-4xl">
        <p className="text-light/70">{t('profile.loading')}</p>
      </PageContainer>
    );
  }
  if (error) {
    return (
      <PageContainer fullHeight centered className="max-w-4xl">
        <p className="text-center text-red-400">
          {t('generic.errorPrefix')}: {resolveErrorMessage(error, ERROR_MAP, t) ?? error}
        </p>
      </PageContainer>
    );
  }
  

  return (
    <PageContainer fullHeight className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-light">{t('profile.title')}</h1>
        <ButtonLink href="/user" variant="outline" size="lg" className="ml-4 flex-1">
          {t('profile.backToThemes')}
        </ButtonLink>
      </div>

      <section className="mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
            <h3 className="text-sm font-semibold text-light/70">{t('profile.gamesPlayed')}</h3>
            <p className="text-2xl font-bold text-light">{stats.totalGames}</p>
          </div>
          <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
            <h3 className="text-sm font-semibold text-light/70">
              {t('profile.questionsAnswered')}
            </h3>
            <p className="text-2xl font-bold text-light">{stats.totalQuestionsAnswered}</p>
          </div>
          <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
            <h3 className="text-sm font-semibold text-light/70">{t('profile.bestStreak')}</h3>
            <p className="text-2xl font-bold text-light">{stats.bestCorrectInRow ?? 0}</p>
            <h3 className="text-sm font-semibold text-light/70">
              {t('profile.bestCurrentStreak')}
            </h3>
            <p className="text-2xl font-bold text-light">
              {stats.currentCorrectInRow ??
                stats.bestCurrentCorrectInRow ??
                stats.bestCorrectInRow ??
                0}
            </p>
          </div>
          <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
            <h3 className="text-sm font-semibold text-light/70">{t('profile.yourQuestions')}</h3>
            <div>
              <p className="text-2xl font-bold text-light">
                {stats.questionsCounts.total ??
                  stats.questionsCounts.strict +
                    stats.questionsCounts.nonStrict +
                    (stats.questionsCounts.words ?? 0)}{' '}
                {t('profile.questionsSummary.total')}
              </p>
              <p className="mt-2 text-sm text-light/70 space-y-1">
                <span className="block">
                  {t('profile.questionsSummary.words')}: {stats.questionsCounts.words ?? 0}
                </span>
                <span className="block">
                  {t('profile.questionsSummary.strict')}: {stats.questionsCounts.strict}
                </span>
                <span className="block">
                  {t('profile.questionsSummary.nonStrict')}: {stats.questionsCounts.nonStrict}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-light mb-4">
          {t('profile.knowledgeDistribution.title')}
        </h2>
        <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
          <ProfileDiagram counts={stats.knowledgeDistribution} />
        </div>
      </section>
    </PageContainer>
  );
});

export default ProfilePage;
