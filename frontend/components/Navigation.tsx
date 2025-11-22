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
    if (!authStore.initialized) {
      authStore.hydrate();
      return;
    }
  
    if (authStore.isAuthenticated) {
      router.push('/user');
    }
  }, [authStore.initialized, authStore.isAuthenticated]);

  return (
    <nav className="border-b border-light/10 bg-dark-hover/50 backdrop-blur-sm sticky top-0 z-50">
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
                className="rounded-lg border border-light/20 bg-transparent px-5 py-2.5 text-sm font-medium text-light hover:border-light/40 hover:bg-light/5"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth?type=login"
                className="rounded-lg border border-light/20 text-sm bg-transparent px-5 py-2.5 text-base font-semibold text-light hover:border-light/40 hover:bg-light/5 hover:scale-[1.02]"
              >
                Log In
              </Link>
              <Link
                href="/auth?type=register"
                className="rounded-lg bg-light px-5 py-2.5 text-sm font-semibold text-dark hover:bg-light-hover hover:scale-[1.02]"
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
