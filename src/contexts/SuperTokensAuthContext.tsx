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
  refreshCoins: () => Promise<void>;
  setCoins: (value: number | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  coins: null,
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

  const fetchCoins = useCallback(async () => {
    if (session.loading || !session.doesSessionExist) {
      setCoins(null);
      return;
    }
    try {
      const res = await fetch("/api/user/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch coins");
      const data = await res.json();
      const value = typeof data?.coins === "number" ? data.coins : 0;
      setCoins(value);
    } catch (error) {
      console.warn("Failed to refresh coins", error);
      setCoins(0);
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

  const logout = async () => {
    await signOut();
    setCoins(null);
    window.location.href = "/";
  };

  const value = useMemo(
    () => ({ user, loading, coins, refreshCoins: fetchCoins, setCoins, logout }),
    [user, loading, coins, fetchCoins]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
