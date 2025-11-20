import Link from 'next/link';
import { observer } from 'mobx-react-lite';
import { themeStore } from '@/store/themeStore';

const PlayPage = observer(() => {
  const hasSelection = themeStore.selectedThemes.length > 0;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-0">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Play Mode
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
          {hasSelection ? 'Get ready!' : 'No themes selected'}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {hasSelection
            ? 'You can now start the interactive session with the selected themes.'
            : 'Head back and choose at least one theme to unlock play mode.'}
        </p>
      </header>

      {hasSelection ? (
        <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {themeStore.selectedThemes.map((theme) => (
            <article key={theme.id} className="border-b border-gray-100 pb-4 last:border-none last:pb-0 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{theme.title}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{theme.description}</p>
              <p className="mt-2 text-xs font-medium text-gray-500">
                Difficulty: {theme.difficulty} · {theme.questions} questions
              </p>
            </article>
          ))}
          <p className="text-sm text-gray-500">
            This is a placeholder view. Hook it to the gameplay experience whenever you&apos;re ready.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-zinc-700">
          Nothing to load yet — add themes first.
        </section>
      )}

      <div className="mt-auto">
        <Link
          href="/user"
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-6 py-3 text-base font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-800"
        >
          Back to Themes
        </Link>
      </div>
    </main>
  );
});

export default PlayPage;

