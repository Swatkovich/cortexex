"use client"

import React from 'react';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string };

export default function TextArea({ className = '', ...rest }: Props) {
  return (
    <textarea {...rest} className={`w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light ${className}`} />
  );
}
