"use client";
import React from "react";
import { t } from '@/lib/i18n';
import { useAuth } from "@/contexts/SuperTokensAuthContext";
import Link from "next/link";

type Plan = {
  id: string;
  coins: number;
  priceCents: number; // USD cents
  popular?: boolean;
};

const PLANS: Plan[] = [
  { id: "starter", coins: 10, priceCents: 199 },
  { id: "lite", coins: 50, priceCents: 799, popular: true },
  { id: "standard", coins: 120, priceCents: 1499 },
  { id: "pro", coins: 300, priceCents: 3499 },
  { id: "mega", coins: 700, priceCents: 6999 },
];

function formatUSD(cents: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
    cents / 100
  );
}

export default function CoinsPage() {
  const { user, loading } = useAuth();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleBuy = async (plan: Plan) => {
    setError(null);
    if (!user) {
      window.location.href = "/api/auth/login?returnTo=/coins";
      return;
    }
    try {
      setBusyId(plan.id);
      const res = await fetch("/api/coins/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Checkout is not available right now");
      }
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url as string;
      } else {
        throw new Error("Checkout URL missing");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start checkout";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const qp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const statusMsg = qp?.get("status") === "success"
    ? "Payment initiated. You'll receive your coins once payment is confirmed."
    : qp?.get("status") === "canceled"
    ? "Checkout was canceled."
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('buyCoins')}</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">{t('viewMap')}</Link>
      </div>

      {statusMsg && (
        <div className="mb-6 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
          {statusMsg}
        </div>
      )}

      {!loading && !user && (
        <div className="mb-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          لطفاً برای خرید سکه وارد شوید.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.id} className={`rounded-lg border p-5 shadow-sm ${p.popular ? "ring-2 ring-amber-400" : ""}`}>
            {p.popular && (
              <div className="mb-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                محبوب‌ترین
              </div>
            )}
            <div className="mb-1 text-lg font-semibold rtl-num">{p.coins} سکه</div>
            <div className="mb-4 text-2xl font-bold rtl-num">{formatUSD(p.priceCents)}</div>
            <ul className="mb-4 list-disc pl-5 text-sm text-gray-600">
              <li>دسترسی فوری به قابلیت‌ها</li>
              <li>بدون انقضا</li>
              <li>حمایت از پروژه</li>
            </ul>
            <button
              onClick={() => handleBuy(p)}
              disabled={!!busyId}
              className="w-full rounded bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {busyId === p.id ? <span className="rtl-num">در حال آغاز پرداخت…</span> : <span className="rtl-num">خرید</span>}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 text-sm text-gray-500">
        توجه: پرداخت‌ها به صورت امن انجام می‌شود و به صفحه پرداخت هدایت خواهید شد.
      </div>
    </div>
  );
}
