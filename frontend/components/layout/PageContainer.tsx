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
        fullHeight && 'min-h-[calc(100vh-4.5rem)]',
        centered && 'flex items-center justify-center',
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12',
          className,
        )}
      >
        {children}
      </div>
    </main>
  );
}
