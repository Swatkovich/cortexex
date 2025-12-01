'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { observer } from 'mobx-react-lite';
import { authStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';

import LangSwitcher from './LangSwitcher';
import { CortexLogo } from './CortexLogo';

const Navigation = observer(() => {
  const router = useRouter();
  const t = useT();


  useEffect(() => {
    if (!authStore.initialized && !authStore.loading) {
      authStore.hydrate();
    }
  }, []);


  useEffect(() => {
    if (!authStore.initialized) {
      authStore.hydrate();
    }
  
  }, [authStore.initialized]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/auth' && authStore.isAuthenticated) {
      router.push('/user');
    }
  }, [router, authStore.isAuthenticated]);

  return (
    <nav className="sticky top-0 z-50 border-b border-light/10 bg-dark-hover/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
            <Link
              href="/"
              className="flex min-w-0 flex-1 items-center gap-2 text-lg font-bold text-light tracking-tight transition-opacity hover:opacity-80 sm:text-xl md:text-2xl"
            >
              <CortexLogo size={40} className="h-10 w-10 flex-shrink-0 sm:h-12 sm:w-12 md:h-14 md:w-14" />
              <span className="truncate">{t('brand')}</span>
            </Link>

            <div className="sm:hidden">
              <LangSwitcher />
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <div className="hidden sm:block">
              <LangSwitcher />
            </div>

            {authStore.isAuthenticated && (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <Link
                  href="/user/profile"
                  className="flex items-center justify-center gap-2 rounded-xl border border-light/20 bg-transparent px-3 py-1.5 text-xs font-medium text-light transition hover:border-light/40 hover:bg-light/5 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0 sm:h-4 sm:w-4"
                  >
                    <path
                      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="truncate">{authStore.user?.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => authStore.logout()}
                  className="w-full rounded-xl border border-light/20 bg-transparent px-3 py-1.5 text-xs font-medium text-light transition hover:border-light/40 hover:bg-light/5 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
                >
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
});

export default Navigation;
