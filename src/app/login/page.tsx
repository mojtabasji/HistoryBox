"use client";
import React, { useState } from "react";
import { PasswordlessPreBuiltUI } from "supertokens-auth-react/recipe/passwordless/prebuiltui";
import SuperTokens from "supertokens-auth-react/ui";
import SuperTokensInitClient from "@/components/SuperTokensInitClient";

export default function LoginPage() {
  const [ready, setReady] = useState(false);
  // Removed legacy /api/auth/sync calls (unused)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded shadow">
        <h1 className="text-xl font-bold mb-4">ورود با پیامک</h1>
        <SuperTokensInitClient onReady={() => setReady(true)} />
        {ready
          ? (SuperTokens.canHandleRoute([PasswordlessPreBuiltUI])
              ? SuperTokens.getRoutingComponent([PasswordlessPreBuiltUI])
              : <p className="text-gray-600">مسیر ورود پیکربندی نشده است.</p>)
          : <p className="text-gray-600">در حال آماده‌سازی ورود…</p>}
      </div>
    </div>
  );
}
