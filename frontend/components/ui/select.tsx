'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  isInvalid?: boolean;
  leadingIcon?: React.ReactNode;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, isInvalid, leadingIcon, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'relative w-full rounded-2xl border border-light/20 bg-dark/40 text-light transition focus-within:border-light/60 focus-within:bg-dark focus-within:ring-2 focus-within:ring-light/30 data-[invalid]:border-red-400 data-[invalid]:ring-red-300/60',
          isInvalid && 'data-[invalid]:border-red-400',
        )}
        data-invalid={isInvalid ? '' : undefined}
      >
        {leadingIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-light/50">
            {leadingIcon}
          </span>
        ) : null}
        <select
          ref={ref}
          className={cn(
            'block w-full appearance-none bg-transparent px-4 py-3 pr-10 text-base text-light focus:outline-none',
            leadingIcon && 'pl-10',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-light/60">
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M5 7l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    );
  },
);

Select.displayName = 'Select';
