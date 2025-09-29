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
  coins: number | null;
  refreshCoins: () => Promise<void>;
  setCoins: (n: number | null) => void;
  logout: () => Promise<void>;
}

const noop = async () => Promise.resolve();
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  coins: null,
  refreshCoins: async () => {},
  setCoins: () => {},
  logout: noop,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState<number | null>(null);
  const didInit = React.useRef(false);
  const inFlight = React.useRef(false);
  const lastFetchedAt = React.useRef(0);
  const initialLoadDone = React.useRef(false);

  useEffect(() => {
    let cancelled = false;

    // Try to hydrate from a short-lived session cache to survive Fast Refresh/HMR
    try {
      const tsRaw = typeof window !== 'undefined' ? sessionStorage.getItem('hb_auth_ts') : null;
      const uRaw = typeof window !== 'undefined' ? sessionStorage.getItem('hb_auth_user') : null;
      const cTsRaw = typeof window !== 'undefined' ? sessionStorage.getItem('hb_coins_ts') : null;
      const cRaw = typeof window !== 'undefined' ? sessionStorage.getItem('hb_user_coins') : null;
      const now = Date.now();
      const freshAuth = tsRaw ? now - parseInt(tsRaw, 10) < 10000 : false; // 10s TTL
      const freshCoins = cTsRaw ? now - parseInt(cTsRaw, 10) < 10000 : false;
      if (freshAuth && uRaw) {
        const parsed = JSON.parse(uRaw) as SimpleUser | null;
        setUser(parsed);
        // only end global loading if it's the first paint
        if (!initialLoadDone.current) setLoading(false);
      }
      if (freshCoins && cRaw) {
        setCoins(Number(cRaw));
      }
    } catch { /* ignore cache errors */ }

    const load = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        // Only show global loading during the very first auth fetch
        if (!initialLoadDone.current) setLoading(true);
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch session');
        const data = await res.json();
        if (!cancelled) {
          setUser(data?.user ?? null);
          // cache user briefly to prevent re-fetch loops under HMR
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('hb_auth_user', JSON.stringify(data?.user ?? null));
              sessionStorage.setItem('hb_auth_ts', String(Date.now()));
            }
          } catch { /* ignore */ }
        }
        // fetch coins in parallel when logged in
        if (!cancelled && data?.user?.email) {
          try {
            const u = await fetch('/api/user', { cache: 'no-store' });
            const uj = await u.json();
            if (!cancelled) {
              const val = typeof uj?.user?.coins === 'number' ? uj.user.coins : 0;
              setCoins(val);
              try {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('hb_user_coins', String(val));
                  sessionStorage.setItem('hb_coins_ts', String(Date.now()));
                }
              } catch { /* ignore */ }
            }
          } catch { if (!cancelled) setCoins(0); }
        } else if (!cancelled) {
          setCoins(null);
        }
      } catch {
        if (!cancelled) setUser(null);
        if (!cancelled) setCoins(null);
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
      // If we had fresh session cache, delay the network refresh slightly to avoid bursts
      let hadFresh = false;
      try {
        const tsRaw = typeof window !== 'undefined' ? sessionStorage.getItem('hb_auth_ts') : null;
        const cTsRaw = typeof window !== 'undefined' ? sessionStorage.getItem('hb_coins_ts') : null;
        const now = Date.now();
        hadFresh = !!(tsRaw && now - parseInt(tsRaw, 10) < 10000) || !!(cTsRaw && now - parseInt(cTsRaw, 10) < 10000);
      } catch { /* ignore */ }
      const delay = hadFresh ? 500 : 0;
      const t = setTimeout(() => void load(), delay);
      return () => clearTimeout(t);
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

  const refreshCoins = async () => {
    try {
      const res = await fetch('/api/user', { cache: 'no-store' });
      const data = await res.json();
      setCoins(typeof data?.user?.coins === 'number' ? data.user.coins : 0);
    } catch { /* ignore */ }
  };

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, coins, refreshCoins, setCoins, logout }),
    [user, loading, coins]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
