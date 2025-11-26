import * as React from 'react';

type CortexLogoProps = {
  className?: string;
  size?: number;
};

export const CortexLogo = ({ className = '', size = 32 }: CortexLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circle background - matches icon.svg */}
      <circle cx="32" cy="32" r="28" fill="#F9F9DF" />
      {/* Neural network nodes */}
      <circle cx="32" cy="32" r="3" fill="#1A1A1A" />
      <circle cx="24" cy="16" r="5" fill="#1A1A1A" />
      <circle cx="40" cy="16" r="5" fill="#1A1A1A" />
      <circle cx="48" cy="32" r="5" fill="#1A1A1A" />
      <circle cx="40" cy="48" r="5" fill="#1A1A1A" />
      <circle cx="24" cy="48" r="5" fill="#1A1A1A" />
      <circle cx="16" cy="32" r="5" fill="#1A1A1A" />
      {/* X pattern through all circles */}
      <path
        // d="M24 16L32 32 M40 16L32 32 M40 48L32 32 M24 48L32 32"
        d="M24 16L32 32 M40 48L32 32 "
        stroke="#1A1A1A"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 16L40 16 M40 16L48 32 M48 32L40 48 M40 48L24 48 M24 48L16 32 M16 32L24 16"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};
