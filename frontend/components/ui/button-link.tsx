'use client';

import Link, { type LinkProps } from 'next/link';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { buttonSizes, buttonVariants, type ButtonSize, type ButtonVariant } from './button';

type ButtonLinkProps = LinkProps & {
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};
export function ButtonLink({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        'inline-flex cursor-pointer w-full items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light/60',
        buttonVariants[variant],
        buttonSizes[size] ?? buttonSizes.md,
        className,
      )}
    >
      {children}
    </Link>
  );
}
