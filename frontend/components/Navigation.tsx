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
    const path = window.location.pathname
    if (path === "/auth") {
      router.push('/user')
    }
  }, [])

  return (
    <nav className="border-b border-light/10 bg-dark-hover/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="flex h-20 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-light tracking-tight transition-opacity hover:opacity-80"
          >
            <CortexLogo size={64} className="flex-shrink-0" />
            <span>{t('brand')}</span>
          </Link>

          <div className='flex gap-3'>

          <div className="flex items-center gap-4">
            <LangSwitcher />
          </div>

          {authStore.isAuthenticated && (
            <div className="flex items-center gap-3">
              <Link href="/user/profile" 
              className="rounded-lg border border-light/20 bg-transparent px-5 py-2.5 text-sm font-medium text-light hover:border-light/40 hover:bg-light/5">
                {authStore.user?.name}
              </Link>
              <button
                type="button"
                onClick={() => authStore.logout()}
                className="w-32 rounded-lg border border-light/20 bg-transparent px-5 py-2.5 text-sm font-medium text-light hover:border-light/40 hover:bg-light/5"
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
