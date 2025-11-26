'use client';

import { ReactNode } from 'react';
import { Card } from './card';

export type ToastVariant = 'success' | 'error' | 'info';

type ToastProps = {
  title: ReactNode;
  message?: ReactNode;
  onClose: () => void;
  variant?: ToastVariant;
};

const variantBorder: Record<ToastVariant, string> = {
  success: 'border-green-500/30',
  error: 'border-red-500/30',
  info: 'border-light/20',
};

const variantTitle: Record<ToastVariant, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-light',
};

export function Toast({ title, message, onClose, variant = 'info' }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex justify-end px-4 pointer-events-none">
      <Card
        className={`relative w-full max-w-sm bg-dark pointer-events-auto shadow-lg shadow-black/40 ${variantBorder[variant]}`}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-dark/50 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-light/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="pr-6 py-3 pl-4">
          <h3 className={`mb-1 text-sm font-semibold ${variantTitle[variant]}`}>{title}</h3>
          {message && <p className="text-xs text-light/80">{message}</p>}
        </div>
      </Card>
    </div>
  );
}


