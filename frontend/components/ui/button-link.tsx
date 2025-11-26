'use client';

import Link, { type LinkProps } from 'next/link';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { buttonSizes, buttonVariants, type ButtonSize, type ButtonVariant } from './button';
import { Spinner } from './spinner';

type ButtonLinkProps = LinkProps & {
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  disabled?: boolean;
};

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      icon,
      iconPosition = 'start',
      disabled,
      ...props
    },
    ref,
  ) => {
    const isIconLeading = icon && iconPosition === 'start';
    const isIconTrailing = icon && iconPosition === 'end';

    return (
      <Link
        ref={ref}
        {...props}
        className={cn(
          'group inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light/60 disabled:cursor-not-allowed disabled:opacity-60',
          buttonVariants[variant],
          buttonSizes[size] ?? buttonSizes.md,
          disabled && 'pointer-events-none',
          className,
        )}
        aria-disabled={disabled || isLoading}
        onClick={(e) => {
          if (disabled || isLoading) {
            e.preventDefault();
            return;
          }
          props.onClick?.(e);
        }}
      >
        {isLoading && <Spinner className="h-5 w-5" />}
        {!isLoading && isIconLeading ? <span>{icon}</span> : null}
        <span className="truncate">{children}</span>
        {!isLoading && isIconTrailing ? <span>{icon}</span> : null}
      </Link>
    );
  },
);

ButtonLink.displayName = 'ButtonLink';
