'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { observer } from 'mobx-react-lite';
import { authStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const Navigation = observer(() => {
  const router = useRouter();


  useEffect(() => {
    if (!authStore.initialized && !authStore.loading) {
      authStore.hydrate();
    }
  }, []);


  useEffect(() => {
    const path = window.location.pathname
    if (authStore.isAuthenticated && (path === '/' || path === '/auth/login' || path === '/auth/register')) {
      router.push('/user');
    }
  }, [authStore.user])

  return (
    <nav className="border-b border-light/10 bg-dark/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="flex h-20 items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold text-light tracking-tight transition-opacity hover:opacity-80"
          >
            CortexEx
          </Link>
          {authStore.isAuthenticated ? (
            <div className="flex items-center gap-6">
              <span className="text-base font-bold text-light/90">
                {authStore.user?.name}
              </span>
              <button
                type="button"
                onClick={() => authStore.logout()}
                className="rounded-lg border border-light/20 bg-transparent px-5 py-2.5 text-sm font-medium text-light transition-all hover:border-light/40 hover:bg-light/5"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-light transition-opacity hover:opacity-70"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-light px-5 py-2.5 text-sm font-semibold text-dark transition-all hover:bg-light-hover hover:scale-[1.02]"
              >
               Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
});

export default Navigation;
