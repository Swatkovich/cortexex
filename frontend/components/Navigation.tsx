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
    <nav className="border-b border-light/10 bg-dark-hover/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl md:text-2xl font-bold text-light tracking-tight transition-opacity hover:opacity-80"
          >
            <CortexLogo size={48} className="sm:w-14 sm:h-14 md:w-16 md:h-16 flex-shrink-0" />
            <span>{t('brand')}</span>
          </Link>

          <div className='flex gap-2 sm:gap-3'>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <LangSwitcher />
          </div>

          {authStore.isAuthenticated && (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/user/profile" 
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-light/20 bg-transparent px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 text-xs sm:text-sm font-medium text-light hover:border-light/40 hover:bg-light/5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="flex-shrink-0 sm:w-4 sm:h-4"
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
                {authStore.user?.name}
              </Link>
              <button
                type="button"
                onClick={() => authStore.logout()}
                className="w-24 sm:w-28 md:w-32 rounded-lg border border-light/20 bg-transparent px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 text-xs sm:text-sm font-medium text-light hover:border-light/40 hover:bg-light/5"
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
