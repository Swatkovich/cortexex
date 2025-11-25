'use client';

import { cn } from '@/lib/utils';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

const sizeMap: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-[2.5px]',
  lg: 'h-6 w-6 border-3',
};

type SpinnerProps = {
  className?: string;
  size?: SpinnerSize;
  label?: string;
};

export function Spinner({ className, size = 'md', label }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading'}
      className="inline-flex items-center gap-2"
    >
      <span
        className={cn(
          'inline-block animate-spin rounded-full border-light/20 border-t-light/80',
          sizeMap[size] ?? sizeMap.md,
          className,
        )}
      />
      {label ? <span className="text-sm text-light/70">{label}</span> : null}
    </span>
  );
}
