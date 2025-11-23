"use client"

import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & { className?: string };

export default function TextInput({ className = '', ...rest }: Props) {
  return (
    <input
      {...rest}
      className={`w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light ${className}`}
    />
  );
}
