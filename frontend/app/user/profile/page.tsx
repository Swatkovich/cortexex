"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authStore } from '@/store/authStore';
import { fetchProfileStats } from '@/lib/api';
import ProfileDiagram from '@/components/ProfileDiagram';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!authStore.initialized) {
      authStore.hydrate();
    }
  }, []);

  useEffect(() => {
    if (authStore.initialized && !authStore.isAuthenticated) {
      router.replace('/auth?type=login');
    }
  }, [authStore.initialized, authStore.isAuthenticated, router]);

  useEffect(() => {
    if (!authStore.isAuthenticated) return;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchProfileStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [authStore.isAuthenticated]);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-dark"><p className="text-light/70">Loading profile...</p></div>;
  if (error) return <div className="p-12 text-center text-red-400">Error: {error}</div>;

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-light mb-6">Profile</h1>

      <section className="mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
            <h3 className="text-sm font-semibold text-light/70">Games played</h3>
            <p className="text-2xl font-bold text-light">{stats.totalGames}</p>
          </div>
          <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
            <h3 className="text-sm font-semibold text-light/70">Questions answered</h3>
            <p className="text-2xl font-bold text-light">{stats.totalQuestionsAnswered}</p>
          </div>
          <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
            <h3 className="text-sm font-semibold text-light/70">Best correct in a row</h3>
            <p className="text-2xl font-bold text-light">{stats.bestCorrectInRow}</p>
          </div>
          <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
            <h3 className="text-sm font-semibold text-light/70">Your questions</h3>
            <p className="text-2xl font-bold text-light">{stats.questionsCounts.strict} strict / {stats.questionsCounts.nonStrict} non-strict</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-light mb-4">Knowledge distribution (strict questions)</h2>
        <div className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6">
          <ProfileDiagram counts={stats.knowledgeDistribution} />
        </div>
      </section>
    </main>
  );
}
