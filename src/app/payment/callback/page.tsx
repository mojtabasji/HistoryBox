"use client";
import React from "react";

export default function PaymentCallbackPage() {
  React.useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const target = `/coins/callback${search}`;
    // Replace history so back doesn't return to external provider
    try {
      window.location.replace(target);
    } catch {
      window.location.href = target;
    }
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-bold">Processing payment callback…</h1>
      <p className="text-sm text-gray-600">You will be redirected shortly. If the redirect does not work, <a href="/coins/callback" className="text-blue-600 hover:underline">click here</a>.</p>
    </div>
  );
}
