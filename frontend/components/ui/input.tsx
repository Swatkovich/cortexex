'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  isInvalid?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, isInvalid, type = 'text', ...props }, ref) => {
    React.useEffect(() => {
      // Inject styles for input autofill to prevent white background
      const styleId = 'input-autofill-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px transparent inset !important;
            -webkit-text-fill-color: rgb(255, 255, 255) !important;
            caret-color: rgb(255, 255, 255) !important;
          }
        `;
        document.head.appendChild(style);
      }
    }, []);

    return (
      <input
        ref={ref}
        type={type}
        data-invalid={isInvalid ? '' : undefined}
        className={cn(
          'w-full rounded-2xl border border-light/20 bg-transparent px-4 py-3 text-base text-light placeholder:text-light/50 transition focus:border-light/60 focus:bg-transparent focus:outline-none focus:ring-2 focus:ring-light/30 data-[invalid]:border-red-400 data-[invalid]:ring-red-300/60',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
