'use client';

import React from 'react';
import { t } from '@/lib/i18n';

interface HeaderCoinCountProps {
  value: number;
  small?: boolean;
  className?: string;
}

export function HeaderCoinCount({ value, small = false, className = '' }: HeaderCoinCountProps) {
  return (
    <div
      className={`rounded-md shadow-md bg-white/80 backdrop-blur flex items-center justify-center font-semibold text-gray-700 ${small ? 'h-10 px-2 text-sm' : 'h-10 px-3 text-sm'} ${className}`}
      title={t('yourCoins')}
      aria-label={t('yourCoins')}
    >
      <span aria-hidden="true" className="mr-1 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={`${small ? 'w-4 h-4' : 'w-5 h-5'}`}
        >
          <circle cx="12" cy="12" r="9" fill="var(--hb-accent)" stroke="#D89F22" strokeWidth="1.2" />
          <path d="M12 7v10M9 10h6M9 14h6" stroke="#7A5608" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="rtl-num">{value}</span>
      <span className="sr-only">{t('yourCoins')}</span>
    </div>
  );
}

export default HeaderCoinCount;
