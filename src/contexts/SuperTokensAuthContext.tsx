"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import SuperTokensInitClient from "@/components/SuperTokensInitClient";
import {
  SessionAuth,
  useSessionContext,
  signOut,
} from "supertokens-auth-react/recipe/session";

interface AuthContextType {
  user: { id: string; phoneNumber?: string } | null;
  loading: boolean;
  coins: number | null;
  phoneNumber?: string;
  refreshCoins: () => Promise<void>;
  setCoins: (value: number | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  coins: null,
  phoneNumber: undefined,
  refreshCoins: async () => {},
  setCoins: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const SuperTokensAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stReady, setStReady] = useState<boolean>(false);
  return (
    <>
      <SuperTokensInitClient onReady={() => setStReady(true)} />
      {stReady ? (
        <SessionAuth requireAuth={false}>
          <SuperTokensAuthProviderInner>{children}</SuperTokensAuthProviderInner>
        </SessionAuth>
      ) : null}
    </>
  );
};

const SuperTokensAuthProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; phoneNumber?: string } | null>(null);
  const [coins, setCoins] = useState<number | null>(null);
  // internal state setter kept private; we expose a wrapped `setCoins` that
  // broadcasts updates across tabs and keeps callers from accidentally
  // overwriting with 0 on network hiccups.
  const [coinsState, setCoinsState] = useState<number | null>(null);
  // Provide a reference-compatible setter to use inside callbacks
  const setCoinsInternal = (v: number | null) => setCoinsState(v);
  useEffect(() => { setCoins(coinsState); }, [coinsState]);
  const session = useSessionContext();

  useEffect(() => {
    if (session.loading) {
      setLoading(true);
      return;
    }

    setLoading(false);

    if (session.doesSessionExist) {
      const phoneNumber = (session.accessTokenPayload as { phoneNumber?: string } | undefined)?.phoneNumber;
      setUser({ id: session.userId, phoneNumber });
    } else {
      setUser(null);
      setCoins(null);
    }
  }, [session]);

  // Hydrate missing phone number from /api/auth/me if not present in token payload
  useEffect(() => {
    const maybeHydratePhone = async () => {
      if (session.loading) return;
      if (!session.doesSessionExist) return;
      if (user && user.phoneNumber) return; // already have
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const apiPhone = data?.user?.phoneNumber;
        if (typeof apiPhone === 'string' && apiPhone.length > 0) {
          setUser((prev) => prev ? { ...prev, phoneNumber: apiPhone } : prev);
        }
      } catch {
        // silent
      }
    };
    void maybeHydratePhone();
  }, [session, user]);

  const fetchCoins = useCallback(async () => {
    if (session.loading || !session.doesSessionExist) {
      setCoinsInternal(null);
      return;
    }
    try {
      const res = await fetch("/api/user/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch coins");
      const data = await res.json();
      const value = typeof data?.coins === "number" ? data.coins : null;
      // only update if we actually received a numeric value
      if (typeof value === 'number') setCoinsInternal(value);
    } catch (error) {
      console.warn("Failed to refresh coins", error);
      // don't clobber the UI with 0 on transient errors; keep previous state
    }
  }, [session]);

  useEffect(() => {
    if (session.loading) return;
    if ("doesSessionExist" in session && session.doesSessionExist) {
      void fetchCoins();
    } else {
      setCoins(null);
    }
  }, [session, fetchCoins]);

  // BroadcastChannel to sync coin updates across tabs (fallback to localStorage event)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    const onMessage = (ev: MessageEvent) => {
      try {
        const msg = ev.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'coins:update') {
          setCoinsInternal(typeof msg.value === 'number' ? msg.value : null);
        }
        if (msg.type === 'coins:refresh') {
          void fetchCoins();
        }
      } catch {
        // ignore
      }
    };
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('historybox');
      // Use onmessage assignment for proper typing instead of casting to any
      bc.onmessage = onMessage;
    } else {
      // storage event fallback
      const onStorage = (e: StorageEvent) => {
        if (e.key !== 'historybox:message' || !e.newValue) return;
        try {
          const msg = JSON.parse(e.newValue);
          onMessage({ data: msg } as MessageEvent);
        } catch {}
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }
    return () => { bc?.close(); };
  }, [fetchCoins]);

  const logout = useCallback(async () => {
    await signOut();
    setCoinsState(null);
    try { if (typeof BroadcastChannel !== 'undefined') new BroadcastChannel('historybox').postMessage({ type: 'coins:update', value: null }); else localStorage.setItem('historybox:message', JSON.stringify({ type: 'coins:update', value: null })); } catch {}
    window.location.href = "/";
  }, [setCoinsState]);

  // Expose a wrapped setCoins that broadcasts the new value and updates state.
  const wrappedSetCoins = useCallback((v: number | null) => {
    setCoinsInternal(v);
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('historybox');
        bc.postMessage({ type: 'coins:update', value: v });
        bc.close();
      } else {
        localStorage.setItem('historybox:message', JSON.stringify({ type: 'coins:update', value: v }));
      }
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, coins, phoneNumber: user?.phoneNumber, refreshCoins: fetchCoins, setCoins: wrappedSetCoins, logout }),
    [user, loading, coins, fetchCoins, wrappedSetCoins, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
