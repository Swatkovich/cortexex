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
    <nav className="border-b border-dark-compose bg-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-light"
          >
            CortexEx
          </Link>
          {authStore.isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-light">
                {authStore.user?.name}
              </span>
              <button
                type="button"
                onClick={() => authStore.logout()}
                className="rounded-md border border-dark-compose px-4 py-2 text-sm font-medium text-light hover:bg-dark-compose"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link
                href="/auth/login"
                className="rounded-md px-4 py-2 text-sm font-medium bg-light text-dark hover:bg-light-hover"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-md px-4 py-2 text-sm font-medium bg-light text-dark hover:bg-light-hover"
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
