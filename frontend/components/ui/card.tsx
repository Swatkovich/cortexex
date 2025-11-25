'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'solid' | 'subtle' | 'ghost';
};

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

const variantMap = {
  solid: 'bg-dark-hover/70 border border-light/15 shadow-[0_25px_60px_rgba(0,0,0,0.35)]',
  subtle: 'bg-dark/40 border border-light/10 backdrop-blur-md',
  ghost: 'bg-transparent border border-light/10',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, padding = 'md', variant = 'subtle', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-3xl transition-shadow duration-200',
          paddingMap[padding],
          variantMap[variant],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
