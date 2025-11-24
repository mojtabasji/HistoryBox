"use client";
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/SuperTokensAuthContext';

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export default function CoinsBadge({ className, rect = false }: { className?: string; rect?: boolean }) {
  const { coins } = useAuth();
  // Accent colored content with neutral surface background for better readability.

  const pillClass = 'pointer-events-auto inline-flex items-center gap-1 rounded-full px-3 py-1 shadow-md bg-[var(--hb-surface)]';
  const rectClass = 'h-10 inline-flex items-center gap-2 px-3 rounded-md shadow-md bg-[var(--hb-surface)] text-sm';

  return (
    <Link
      href="/coins"
      className={classNames(rect ? rectClass : pillClass, className)}
      title={`Coins: ${coins ?? 0}`}
      aria-label={`Coins: ${coins ?? 0} – رفتن به خرید سکه`}
      style={{ color: 'var(--hb-accent-coin)' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={rect ? 'h-5 w-5' : 'h-4 w-4'}
        aria-hidden
        style={{ color: 'var(--hb-accent-coin)' }}
      >
        <path d="M12 2C6.477 2 2 4.239 2 7s4.477 5 10 5 10-2.239 10-5-4.477-5-10-5Zm0 12c-5.523 0-10-2.239-10-5v3c0 2.761 4.477 5 10 5s10-2.239 10-5V9c0 2.761-4.477 5-10 5Zm0 4c-5.523 0-10-2.239-10-5v3c0 2.761 4.477 5 10 5s10-2.239 10-5v-3c0 2.761-4.477 5-10 5Z" />
      </svg>
      <span className={classNames('text-sm font-semibold tabular-nums rtl-num')} style={{ color: 'var(--hb-accent-coin)' }}>{coins === null ? '20' : coins}</span>
    </Link>
  );
}
