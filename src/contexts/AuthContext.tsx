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

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
  const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Failed to fetch session');
        const data = await res.json();
        // data.user shape: { sub, name, email, picture }
        if (!cancelled) setUser(data?.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    // revalidate on focus
    const onFocus = () => load();
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
