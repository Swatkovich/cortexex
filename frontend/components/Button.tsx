"use client"

import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' };

export default function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  const base = 'rounded-xl px-6 py-3 font-semibold disabled:opacity-50';
  const variants: Record<string, string> = {
    primary: 'bg-light text-dark',
    ghost: 'border border-light/20 bg-transparent text-light',
    danger: 'bg-red-500 text-white',
  };

  return (
    <button className={`${base} ${variants[variant] ?? variants.primary} ${className}`} {...rest}>
      {children}
    </button>
  );
}
