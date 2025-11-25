'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  isInvalid?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, isInvalid, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-invalid={isInvalid ? '' : undefined}
        className={cn(
          'w-full rounded-2xl border border-light/20 bg-dark/40 px-4 py-3 text-base text-light placeholder:text-light/50 transition focus:border-light/60 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/30 data-[invalid]:border-red-400 data-[invalid]:ring-red-300/60',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
