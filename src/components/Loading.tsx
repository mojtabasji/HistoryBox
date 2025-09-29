'use client';

import React from 'react';

type LoadingProps = {
  label?: string;
  variant?: 'inline' | 'inset' | 'cover' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

type BorderClass = 'border-2' | 'border-4';
const sizeMap: Record<NonNullable<LoadingProps['size']>, { box: string; border: BorderClass }> = {
  sm: { box: 'h-4 w-4', border: 'border-2' },
  md: { box: 'h-6 w-6', border: 'border-2' },
  lg: { box: 'h-8 w-8', border: 'border-4' },
  xl: { box: 'h-12 w-12', border: 'border-4' },
};

export function Spinner({ size = 'md', className = '' }: { size?: LoadingProps['size']; className?: string }) {
  const sz = sizeMap[size || 'md'];
  const borderClass = sz.border;
  return (
    <span
      className={`inline-block ${sz.box} ${borderClass} border-indigo-600 border-t-transparent rounded-full animate-spin ${className}`}
      aria-hidden="true"
    />
  );
}

export default function Loading({ label, variant = 'inset', size = 'md', className = '' }: LoadingProps) {
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <Spinner size={size} />
        {label && <span className="text-sm text-gray-600">{label}</span>}
      </span>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div className={`fixed inset-0 z-[10000] flex items-center justify-center bg-white/70 backdrop-blur-sm ${className}`} role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="xl" />
          {label && <div className="text-base text-gray-700 font-medium">{label}</div>}
        </div>
      </div>
    );
  }

  // cover variant: absolute cover within a relatively positioned parent
  if (variant === 'cover') {
    return (
      <div className={`absolute inset-0 z-[1000] flex items-center justify-center bg-white/70 backdrop-blur-sm ${className}`} role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          {label && <div className="text-sm text-gray-700">{label}</div>}
        </div>
      </div>
    );
  }

  // inset variant: centered within its container
  return (
    <div className={`w-full min-h-[8rem] flex items-center justify-center ${className}`} role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={size} />
        {label && <div className="text-sm text-gray-600">{label}</div>}
      </div>
    </div>
  );
}
