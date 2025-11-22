"use client"

import Link from 'next/link';
import { observer } from 'mobx-react-lite';
import { themeStore } from '@/store/themeStore';

const PlayPage = observer(() => {
  const hasSelection = themeStore.selectedThemes.length > 0;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-light/60">
          Play Mode
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-light sm:text-5xl">
          {hasSelection ? 'Get ready!' : 'No themes selected'}
        </h1>
        <p className="max-w-2xl text-lg text-light/70">
          {hasSelection
            ? 'You can now start the interactive session with the selected themes.'
            : 'Head back and choose at least one theme to unlock play mode.'}
        </p>
      </header>

      {hasSelection ? (
        <section className="space-y-4 rounded-2xl border border-light/10 bg-dark/50 p-8 backdrop-blur-sm">
          {themeStore.selectedThemes.map((theme) => (
            <article key={theme.id} className="border-b border-light/10 pb-6 last:border-none last:pb-0">
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-full border border-light/20 bg-light/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-light/60">
                  {theme.difficulty}
                </span>
                <span className="text-xs text-light/50">
                  {theme.questions} questions
                </span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-light">{theme.title}</h2>
              <p className="text-sm leading-relaxed text-light/70">{theme.description}</p>
            </article>
          ))}
          <div className="mt-6 rounded-lg border border-light/10 bg-light/5 p-4">
            <p className="text-sm text-light/60">
              This is a placeholder view. Hook it to the gameplay experience whenever you&apos;re ready.
            </p>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-light/20 bg-dark/30 p-12 text-center">
          <p className="text-sm font-medium text-light/50">
            Nothing to load yet — add themes first.
          </p>
        </section>
      )}

      <div className="mt-auto">
        <Link
          href="/user"
          className="inline-flex items-center justify-center rounded-xl border border-light/20 bg-transparent px-8 py-4 text-base font-semibold text-light hover:border-light/40 hover:bg-light/5"
        >
          Back to Themes
        </Link>
      </div>
    </main>
  );
});

export default PlayPage;

