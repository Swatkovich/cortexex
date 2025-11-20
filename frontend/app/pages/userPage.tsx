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
      router.replace('/login');
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-gray-600 dark:text-gray-300">Checking your session...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-0">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Choose your next challenge
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Pick one or multiple themes to activate the play mode. You can also craft a
          custom theme that fits your session.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {themeStore.themes.map((theme) => (
          <article
            key={theme.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {theme.difficulty}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {theme.title}
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {theme.description}
                </p>
                <p className="mt-3 text-xs font-medium text-gray-500">
                  {theme.questions} curated questions
                </p>
              </div>

              <button
                type="button"
                onClick={() => themeStore.toggleTheme(theme.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  themeStore.isSelected(theme.id)
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-800'
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
          className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Play
        </button>
        <button
          type="button"
          onClick={handleCreateTheme}
          className="flex-1 rounded-xl border border-gray-300 px-6 py-3 text-center text-base font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-800"
        >
          Create Theme
        </button>
      </section>
    </main>
  );
});

export default UserPage;

