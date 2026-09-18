import React from 'react';

interface NanobaneLogoProps {
  className?: string;
  size?: number;
}

export const NanobaneLogo: React.FC<NanobaneLogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="100" height="100" rx="24" fill="#0E0F0C" />
      {/* Stylized N with Upward Growth Arrow */}
      <path
        d="M 24 72 L 24 32 L 48 64 L 72 26"
        stroke="#9FE870"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 52 26 L 72 26 L 72 46"
        stroke="#9FE870"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
