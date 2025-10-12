"use client";
import React from 'react';
import { useAuth } from '@/contexts/SuperTokensAuthContext';

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export default function CoinsBadge({ className }: { className?: string }) {
  const { coins } = useAuth();
  // No automatic fetches here; AuthContext handles initial load and focus refreshes.

  return (
    <div
      className={classNames(
        'pointer-events-auto inline-flex items-center gap-1 rounded-full bg-amber-100/90 px-3 py-1 text-amber-800 shadow ring-1 ring-amber-300',
        className
      )}
      title={`Coins: ${coins ?? 0}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4 text-amber-600"
        aria-hidden
      >
        <path d="M12 2C6.477 2 2 4.239 2 7s4.477 5 10 5 10-2.239 10-5-4.477-5-10-5Zm0 12c-5.523 0-10-2.239-10-5v3c0 2.761 4.477 5 10 5s10-2.239 10-5V9c0 2.761-4.477 5-10 5Zm0 4c-5.523 0-10-2.239-10-5v3c0 2.761 4.477 5 10 5s10-2.239 10-5v-3c0 2.761-4.477 5-10 5Z" />
      </svg>
      <span className="text-sm font-semibold tabular-nums">{coins === null ? '—' : coins}</span>
    </div>
  );
}
