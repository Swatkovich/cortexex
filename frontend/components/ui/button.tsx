'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

export const buttonVariants = {
  primary:
    'bg-light text-dark shadow-[0_20px_45px_rgba(0,0,0,0.35)] hover:bg-light-hover hover:shadow-[0_25px_55px_rgba(0,0,0,0.45)]',
  secondary: 'bg-dark/40 text-light border border-light/20 hover:border-light/40 hover:bg-dark/60',
  outline:
    'bg-transparent text-light border border-light/20 hover:border-light/40 hover:bg-light/5',
  ghost: 'bg-transparent text-light/80 hover:text-light hover:bg-light/10',
  danger: 'bg-red-500/80 text-white shadow-[0_20px_35px_rgba(239,68,68,0.35)] hover:bg-red-500',
  subtle: 'bg-light/10 text-light border border-light/10 hover:border-light/30 hover:bg-light/15',
};

export const buttonSizes = {
  sm: 'h-9 rounded-lg px-3 text-sm',
  md: 'h-11 rounded-xl px-5 text-base',
  lg: 'h-13 rounded-2xl px-6 text-lg',
  icon: 'h-10 w-10 rounded-2xl',
  fluid: 'w-full h-12 rounded-2xl px-6 text-base',
};

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      type = 'button',
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
      <button
        ref={ref}
        type={type}
        className={cn(
          'group inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light/60 disabled:cursor-not-allowed disabled:opacity-60',
          buttonVariants[variant],
          buttonSizes[size] ?? buttonSizes.md,
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Spinner className="h-5 w-5" />}
        {!isLoading && isIconLeading ? <span>{icon}</span> : null}
        <span className="truncate">{children}</span>
        {!isLoading && isIconTrailing ? <span>{icon}</span> : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
