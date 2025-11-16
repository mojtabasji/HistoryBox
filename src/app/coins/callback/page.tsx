"use client";
import React from 'react';
import Link from 'next/link';

type VerifyResult = {
  status?: string;
  credited?: boolean;
  coinsAdded?: number;
  newBalance?: number | null;
  [key: string]: unknown;
};

export default function CoinsCallbackPage() {
  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const tx = search?.get('transaction_id') || search?.get('tx') || search?.get('id') || '';
  const [state, setState] = React.useState<'idle' | 'verifying' | 'done' | 'error'>('idle');
  const [result, setResult] = React.useState<VerifyResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function run() {
      if (!tx) {
        setError('Missing transaction_id');
        setState('error');
        return;
      }
      setState('verifying');
      try {
        const res = await fetch(`/api/coins/verify/${encodeURIComponent(tx)}`, { method: 'POST' });
        const data = await res.json().catch(() => ({} as Record<string, unknown>));
        if (!res.ok) {
          const errMsg = (data as { error?: string })?.error ?? 'Verification failed';
          throw new Error(errMsg);
        }
        if (!mounted) return;
        setResult(data as VerifyResult);
        setState('done');
      } catch (e) {
        if (!mounted) return;
        const msg = e instanceof Error ? e.message : 'Verification failed';
        setError(msg);
        setState('error');
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [tx]);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-bold">Payment Verification</h1>
      {state === 'verifying' && (
        <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">Verifying your payment…</div>
      )}
      {state === 'error' && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">{error}</div>
      )}
      {state === 'done' && (
        <div className="space-y-4">
          {result?.status === 'success' ? (
            <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">
              Payment verified successfully.
              {result?.credited ? (
                <>
                  <div className="mt-2">Added {result.coinsAdded} coins to your account.</div>
                  {typeof result.newBalance === 'number' && (
                    <div className="mt-1">New balance: {result.newBalance}</div>
                  )}
                </>
              ) : (
                <div className="mt-2">Login to see your updated balance if not credited automatically.</div>
              )}
            </div>
          ) : (
            <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              Payment not successful. If funds were captured, please contact support.
            </div>
          )}
          <div>
            <Link href="/coins" className="text-blue-600 hover:underline">Return to coins</Link>
          </div>
        </div>
      )}
    </div>
  );
}
