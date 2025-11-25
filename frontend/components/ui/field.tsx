'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

type FieldProps = {
  label?: React.ReactNode;
  htmlFor?: string;
  description?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md';
  children: React.ReactNode;
  required?: boolean;
};

const spacingMap = {
  sm: 'space-y-2',
  md: 'space-y-3',
};

export function FormField({
  label,
  htmlFor,
  description,
  error,
  className,
  spacing = 'md',
  children,
  required,
}: FieldProps) {
  return (
    <div className={cn('w-full', spacingMap[spacing], className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-light/60"
        >
          {label}
          {required ? (
            <span className="text-light/50" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {description ? <p className="text-xs text-light/60">{description}</p> : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
