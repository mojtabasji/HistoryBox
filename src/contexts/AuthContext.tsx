'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// We will source session info from Auth0 Next.js SDK endpoints
// to keep a lightweight client context compatible with existing useAuth()

type SimpleUser = {
  sub: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
};

interface AuthContextType {
  user: SimpleUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const noop = async () => Promise.resolve();
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: noop,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const didInit = React.useRef(false);
  const inFlight = React.useRef(false);
  const lastFetchedAt = React.useRef(0);
  const initialLoadDone = React.useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        // Only show global loading during the very first auth fetch
        if (!initialLoadDone.current) setLoading(true);
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch session');
        const data = await res.json();
        if (!cancelled) setUser(data?.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        lastFetchedAt.current = Date.now();
        inFlight.current = false;
        if (!cancelled && !initialLoadDone.current) {
          setLoading(false);
          initialLoadDone.current = true;
        }
      }
    };

    // Guard against Strict Mode double-invocation in dev
    if (!didInit.current) {
      didInit.current = true;
      void load();
    }

    // Revalidate on window focus, but rate-limit to avoid duplicates
    const onFocus = () => {
      const now = Date.now();
      if (now - lastFetchedAt.current < 5000) return; // 5s cooldown
      void load();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const logout = async () => {
    // Redirect to Auth0 logout endpoint via nextjs sdk route
    window.location.href = '/api/auth/logout';
  };

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
