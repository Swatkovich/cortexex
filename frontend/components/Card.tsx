"use client"

import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & { className?: string };

export default function Card({ className = '', children, ...rest }: Props) {
  return (
    <div className={`rounded-2xl border border-light/10 bg-dark/50 p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
}
