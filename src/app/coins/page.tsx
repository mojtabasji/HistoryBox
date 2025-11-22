"use client";
import React from "react";
import { t } from '@/lib/i18n';
import { useAuth } from "@/contexts/SuperTokensAuthContext";
import Link from "next/link";

type Plan = {
  id: string;
  coins: number;
  price: number; // Stored as IRR (رﺍﻳﻞ ایران)
  popular?: boolean;
};

const PLANS: Plan[] = [
  { id: "starter", coins: 20, price: 150000 },
  { id: "lite", coins: 50, price: 500000, popular: true },
  { id: "standard", coins: 120, price: 900000 },
  { id: "pro", coins: 300, price: 2300000 },
  { id: "mega", coins: 700, price: 5000000 },
];

function formatIRR(amount: number) {
  // Amount assumed already in IRR. Format with Persian locale & currency code IRR
  return new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'IRR', maximumFractionDigits: 0 }).format(amount);
}

export default function CoinsPage() {
  const { user, loading, coins } = useAuth();
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
    ? "پرداخت آغاز شد. پس از تایید سکه‌ها اضافه می‌شوند."
    : qp?.get("status") === "canceled"
    ? "فرایند پرداخت لغو شد."
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold flex items-center gap-3" dir="rtl">
            {t('buyCoins')}
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-800 text-sm font-semibold rtl-num" title={`سکه‌های فعلی: ${coins ?? 0}`}>{t('yourCoins') + ":"} {coins ?? 0}</span>
          </h1>
          <p className="text-sm text-gray-600">با خرید بسته‌های زیر، موجودی خود را افزایش دهید.</p>
        </div>
        <Link href="/" className="inline-flex items-center rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium shadow">
          ← {t('backToMap')}
        </Link>
      </div>

      {statusMsg && (
        <div className="mb-6 rounded bg-blue-50 px-4 py-3 text-blue-800 shadow-sm">
          {statusMsg}
        </div>
      )}

      {!loading && !user && (
        <div className="mb-6 rounded bg-amber-50 px-4 py-3 text-amber-800 shadow-sm">
          لطفاً برای خرید سکه وارد شوید.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded bg-red-50 px-4 py-3 text-red-800 shadow-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.id} className={`rounded-lg p-5 shadow-md bg-white ${p.popular ? "ring-2 ring-amber-400" : ""}`}>
            {p.popular && (
              <div className="mb-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                محبوب‌ترین
              </div>
            )}
            <div className="mb-1 text-lg font-semibold rtl-num">{p.coins} سکه</div>
            <div className="mb-4 text-2xl font-bold rtl-num">{formatIRR(p.price)}</div>
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
