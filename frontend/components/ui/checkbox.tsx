'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <label className="flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-light/15 bg-dark/40 px-4 py-3 transition hover:border-light/40 hover:bg-dark/60">
        <span className="pointer-events-none relative mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-light/30 bg-dark/60">
          <input
            ref={ref}
            type="checkbox"
            className={cn(
              'peer absolute inset-0 h-full w-full cursor-pointer opacity-0',
              className,
            )}
            {...props}
          />
          <svg
            className="pointer-events-none h-3.5 w-3.5 text-light opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 10.5l3 3 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="flex flex-col">
          {label ? <span className="text-sm font-medium text-light">{label}</span> : null}
          {description ? <span className="text-xs text-light/60">{description}</span> : null}
        </span>
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
