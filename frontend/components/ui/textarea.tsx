'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  isInvalid?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, isInvalid, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
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

Textarea.displayName = 'Textarea';
