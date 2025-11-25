"use client"

import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & { className?: string };

const TextInput = React.forwardRef<HTMLInputElement, Props>(({ className = '', ...rest }, ref) => {
  return (
    <input
      ref={ref}
      {...rest}
      className={`w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light ${className}`}
    />
  );
});

TextInput.displayName = 'TextInput';

export default TextInput;
