'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { autorun } from 'mobx';
import { authStore } from '@/store/authStore';

export function useProtectedRoute(redirectTo: string = '/') {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (!authStore.initialized && !authStore.loading) {
      authStore.hydrate();
    }
  }, []);

  useEffect(() => {
    const disposer = autorun(() => {
      if (authStore.loading || !authStore.initialized) {
        setIsAllowed(false);
        return;
      }

      if (!authStore.isAuthenticated) {
        setIsAllowed(false);
        router.replace(redirectTo);
        return;
      }

      setIsAllowed(true);
    });

    return () => disposer();
  }, [router, redirectTo]);

  return isAllowed;
}

