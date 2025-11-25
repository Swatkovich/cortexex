"use client"

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import { authStore } from '@/store/authStore';
import { fetchProfileStats } from '@/lib/api';
import ProfileDiagram from '@/components/ProfileDiagram';
import { useT } from '@/lib/i18n';
import { resolveErrorMessage } from '@/lib/i18n/errorMap';

const ProfilePage = observer(() => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const t = useT();
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
    if (authStore.initialized && !authStore.isAuthenticated) {
      router.replace('/auth?type=login');
    }
  }, [authStore.initialized, authStore.isAuthenticated, router]);

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

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-dark"><p className="text-light/70">{t('profile.loading')}</p></div>;
  if (error) return <div className="p-12 text-center text-red-400">{t('generic.errorPrefix')}: {resolveErrorMessage(error, ERROR_MAP, t) ?? error}</div>;

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-4xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-light">{t('profile.title')}</h1>
        <Link href="/user" className="ml-4">
          <Button variant="ghost" className="px-4 py-2 text-sm">{t('profile.backToThemes')}</Button>
        </Link>
      </div>

      <section className="mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
            <h3 className="text-sm font-semibold text-light/70">{t('profile.gamesPlayed')}</h3>
            <p className="text-2xl font-bold text-light">{stats.totalGames}</p>
          </div>
          <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
            <h3 className="text-sm font-semibold text-light/70">{t('profile.questionsAnswered')}</h3>
            <p className="text-2xl font-bold text-light">{stats.totalQuestionsAnswered}</p>
          </div>
          <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
            <h3 className="text-sm font-semibold text-light/70">{t('profile.bestStreak')}</h3>
            <p className="text-2xl font-bold text-light">{stats.bestCorrectInRow ?? 0}</p>
            <h3 className="text-sm font-semibold text-light/70">{t('profile.bestCurrentStreak')}</h3>
            <p className="text-2xl font-bold text-light">{stats.currentCorrectInRow ?? stats.bestCurrentCorrectInRow ?? stats.bestCorrectInRow ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
            <h3 className="text-sm font-semibold text-light/70">{t('profile.yourQuestions')}</h3>
            <div>
              <p className="text-2xl font-bold text-light">
                {stats.questionsCounts.total ?? (stats.questionsCounts.strict + stats.questionsCounts.nonStrict + (stats.questionsCounts.words ?? 0))} {t('profile.questionsSummary.total')}
              </p>
              <p className="mt-2 text-sm text-light/70 space-y-1">
                <span className="block">{t('profile.questionsSummary.words')}: {stats.questionsCounts.words ?? 0}</span>
                <span className="block">{t('profile.questionsSummary.strict')}: {stats.questionsCounts.strict}</span>
                <span className="block">{t('profile.questionsSummary.nonStrict')}: {stats.questionsCounts.nonStrict}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-light mb-4">{t('profile.knowledgeDistribution.title')}</h2>
        <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
          <ProfileDiagram counts={stats.knowledgeDistribution} />
        </div>
      </section>
    </main>
  );
});

export default ProfilePage;
