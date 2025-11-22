'use client'

import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import { themeStore } from '@/store/themeStore';
import { authStore } from '@/store/authStore';

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

  const handlePlay = () => {
    if (!themeStore.canPlay) {
      return;
    }
    router.push('/game');
  };

  const handleCreateTheme = () => {
    router.push('/createTheme');
  };

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark">
        <p className="text-lg text-light/70">Checking your session...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-12 px-6 py-12 sm:px-8 lg:px-12">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-light/60">
          Dashboard
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-light sm:text-5xl">
          Choose your next challenge
        </h1>
        <p className="max-w-2xl text-lg text-light/70">
          Pick one or multiple themes to activate the play mode. You can also craft a
          custom theme that fits your session.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {themeStore.themes.map((theme) => (
          <article
            key={theme.id}
            className="group rounded-2xl border border-light/10 bg-dark-hover/50 p-6 backdrop-blur-sm hover:border-light/50"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-light/60">
                  {theme.difficulty}
                </p>
                <h2 className="text-xl font-bold text-light">
                  {theme.title}
                </h2>
                <p className="text-sm leading-relaxed text-light/70">
                  {theme.description}
                </p>
                <p className="text-xs font-medium text-light/50">
                  {theme.questions} curated questions
                </p>
              </div>

              <button
                type="button"
                onClick={() => themeStore.toggleTheme(theme.id)}
                className={`h-fit rounded-lg px-5 py-2.5 text-sm font-semibold ${
                  themeStore.isSelected(theme.id)
                    ? 'bg-light text-dark hover:bg-light-hover hover:scale-105'
                    : 'border border-light/20 bg-transparent text-light hover:border-light/40 hover:bg-light/5 hover:scale-105'
                }`}
              >
                {themeStore.isSelected(theme.id) ? 'Selected' : 'Select'}
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handlePlay}
          disabled={!themeStore.canPlay}
          className="flex-1 rounded-xl bg-light px-8 py-4 text-center text-base font-semibold text-dark hover:bg-light-hover disabled:cursor-not-allowed disabled:hover:bg-light disabled:opacity-50"
        >
          Play
        </button>
        <button
          type="button"
          onClick={handleCreateTheme}
          className="flex-1 rounded-xl border border-light/20 bg-transparent px-8 py-4 text-center text-base font-semibold text-light hover:border-light/40 hover:bg-light/5"
        >
          Create Theme
        </button>
      </section>
    </main>
  );
});

export default UserPage;

