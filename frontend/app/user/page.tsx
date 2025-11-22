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
      router.replace('/auth/login');
    }
  }, [initialized, isAuthenticated, router]);

  const handlePlay = () => {
    if (!themeStore.canPlay) {
      return;
    }
    router.push('/play');
  };

  const handleCreateTheme = () => {
    router.push('/create-theme');
  };

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark">
        <p className="text-light">Checking your session...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-0">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-light">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-light">
          Choose your next challenge
        </h1>
        <p className="mt-2 text-light">
          Pick one or multiple themes to activate the play mode. You can also craft a
          custom theme that fits your session.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {themeStore.themes.map((theme) => (
          <article
            key={theme.id}
            className="rounded-2xl border border-light bg-dark p-5 shadow-[0_0px_60px_rgba(249,249,223,0.25)] transition hover:shadow-[0_0px_80px_rgba(249,249,223,0.35)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-light">
                  {theme.difficulty}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-light">
                  {theme.title}
                </h2>
                <p className="mt-2 text-sm text-light">
                  {theme.description}
                </p>
                <p className="mt-3 text-xs font-medium text-light">
                  {theme.questions} curated questions
                </p>
              </div>

              <button
                type="button"
                onClick={() => themeStore.toggleTheme(theme.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  themeStore.isSelected(theme.id)
                    ? 'bg-light text-dark hover:bg-light-hover'
                    : 'border border-light text-light hover:bg-light-hover hover:text-dark'
                }`}
              >
                {themeStore.isSelected(theme.id) ? 'Selected' : 'Select'}
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-4 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handlePlay}
          disabled={!themeStore.canPlay}
          className="flex-1 rounded-xl bg-light px-6 py-3 text-center text-base font-semibold text-dark transition hover:bg-light-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Play
        </button>
        <button
          type="button"
          onClick={handleCreateTheme}
          className="flex-1 rounded-xl border border-light px-6 py-3 text-center text-base font-semibold text-light transition hover:bg-light-hover hover:text-dark"
        >
          Create Theme
        </button>
      </section>
    </main>
  );
});

export default UserPage;

