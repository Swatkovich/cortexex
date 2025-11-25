'use client';

import { cn } from '@/lib/utils';
import React from 'react';

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
  centered?: boolean;
};

export function PageContainer({ children, className, fullHeight, centered }: PageContainerProps) {
  return (
    <main
      className={cn(
        'w-full bg-dark',
        fullHeight && 'min-h-[calc(100vh-4rem)]',
        centered && 'flex items-center justify-center',
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:px-10 lg:px-12',
          className,
        )}
      >
        {children}
      </div>
    </main>
  );
}
