"use client";
import React, { useEffect, useState } from "react";
import { PasswordlessPreBuiltUI } from "supertokens-auth-react/recipe/passwordless/prebuiltui";
import SuperTokens from "supertokens-auth-react/ui";
import SuperTokensInitClient from "@/components/SuperTokensInitClient";

export default function LoginPage() {
  const [ready, setReady] = useState(false);
  // After SuperTokens mounts and can handle route, sync user on first render
  useEffect(() => {
    if (!ready) return;
    // Avoid duplicate syncs for Prisma user creation, but allow Supabase retry until success
    const hasPrismaSynced = typeof window !== 'undefined' && sessionStorage.getItem('prismaSynced') === '1';
    const hasSupabaseSynced = typeof window !== 'undefined' && sessionStorage.getItem('supabaseSynced') === '1';
    if (hasPrismaSynced && hasSupabaseSynced) return;
    (async () => {
      try {
  const res = await fetch('/api/auth/sync', { method: 'GET', cache: 'no-store', credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('prismaSynced', '1');
            if (data?.supabase?.attempted && data?.supabase?.ok) {
              sessionStorage.setItem('supabaseSynced', '1');
            }
          }
        } else {
          console.warn('Auth sync failed', data);
        }
      } catch {
        // ignore
      }
    })();
  }, [ready]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded shadow">
        <h1 className="text-xl font-bold mb-4">Login with SMS</h1>
        <SuperTokensInitClient onReady={() => setReady(true)} />
        {ready
          ? (SuperTokens.canHandleRoute([PasswordlessPreBuiltUI])
              ? SuperTokens.getRoutingComponent([PasswordlessPreBuiltUI])
              : <p className="text-gray-600">Login route not handled.</p>)
          : <p className="text-gray-600">Loading login…</p>}
      </div>
    </div>
  );
}
