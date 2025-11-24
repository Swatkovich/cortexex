"use client";

import Link from 'next/link';
import { observer } from 'mobx-react-lite';
import { authStore } from '@/store/authStore';
import { useT } from '@/lib/i18n';

const HomePage = observer(() => {
  const isAuthenticated = authStore.isAuthenticated;
  const t = useT();

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark font-sans">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 inline-block rounded-full border border-light/20 bg-light/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-light/80">
          {t('home.beta')}
        </div>
        <h1 className="mb-6 text-6xl font-bold leading-tight text-light sm:text-7xl lg:text-8xl">
          {t('home.h1.part1')}
          <br />
          <span className="bg-gradient-to-r from-light to-light/60 bg-clip-text text-transparent">
            {t('home.h1.part2')}
          </span>
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-light/70 sm:text-xl">
          {t('home.subtitle')}
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {isAuthenticated ? (
            <Link
              href="/user"
              className="rounded-xl bg-light px-8 py-4 text-base font-semibold text-dark hover:bg-light-hover"
            >
              {t('home.getStarted')}
            </Link>
          ) : (
            <>
              <Link
                href="/auth?type=register"
                className="rounded-xl bg-light px-8 py-4 text-base font-semibold text-dark hover:bg-light-hover"
              >
                {t('home.register')}
              </Link>
              <Link
                href="/auth?type=login"
                className="rounded-xl border border-light/20 bg-transparent px-8 py-4 text-base font-semibold text-light  hover:border-light/40 hover:bg-light/5 hover:scale-105"
              >
                {t('home.login')}
              </Link>
            </>
          )}
        </div>
        <p className="mt-12 text-sm text-light/50">
         {t('home.developing')}
        </p>
      </div>
    </div>
  );
});

export default HomePage;
