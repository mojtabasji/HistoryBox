'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SuperTokensAuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

type Memory = {
  id: number;
  title: string;
  description?: string | null;
  caption?: string | null;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  memoryDate?: string | null;
  createdAt: string;
};

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Ensure we only render locale-sensitive values after mount to avoid SSR/CSR mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchMemories = async () => {
      if (!user) return;
      // Ensure server has synced/authenticated user to DB/Supabase before fetching
      if (typeof window !== 'undefined') {
        const hasPrismaSynced = sessionStorage.getItem('prismaSynced') === '1';
        const hasSupabaseSynced = sessionStorage.getItem('supabaseSynced') === '1';
        if (!hasPrismaSynced || !hasSupabaseSynced) {
          try {
            const res = await fetch('/api/auth/sync', { method: 'GET', cache: 'no-store', credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              sessionStorage.setItem('prismaSynced', '1');
              if (data?.supabase?.attempted && data?.supabase?.ok) {
                sessionStorage.setItem('supabaseSynced', '1');
              }
            }
          } catch {
            // non-fatal
          }
        }
      }
      setLoadingMemories(true);
      setError(null);
      try {
        const res = await fetch('/api/memories');
        const data = await res.json();
        if (!res.ok) {
          const prefix = res.status === 401 ? 'Auth error' : 'Server error';
          throw new Error(`${prefix}: ${data.error || 'Failed to load memories'}`);
        }
        setMemories(data.memories || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load memories');
      } finally {
        setLoadingMemories(false);
      }
    };
    fetchMemories();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">History Box</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/coins" 
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Buy Coins
              </Link>
              <Link 
                href="/" 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                View Map
              </Link>
              <div className="text-right text-xs text-gray-700">
                <div>{user?.phoneNumber ? `Welcome, ${user.phoneNumber}` : 'Welcome'}</div>
                <div className="text-[11px] text-gray-500">UserId: {user?.id}</div>
              </div>
              <button onClick={handleLogout} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Memories</h2>
            <div className="space-x-2">
              <Link
                href="/coins"
                className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Buy Coins
              </Link>
              <Link
                href="/"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Explore Map
              </Link>
              <a
                href="/add-memory"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Memory
              </a>
            </div>
          </div>

          {loadingMemories && (
            <div className="border rounded-lg p-6 bg-white shadow">
              <p className="text-gray-600">Loading your memories...</p>
            </div>
          )}

          {error && (
            <div className="border rounded-lg p-4 bg-red-50 text-red-700">
              {error}
            </div>
          )}

          {!loadingMemories && !error && memories.length === 0 && (
            <div className="border rounded-lg p-6 bg-white shadow text-center">
              <p className="text-gray-600">No memories yet. Start by adding your first one!</p>
            </div>
          )}

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {memories.map((m) => (
              <div key={m.id} className="bg-white rounded-lg shadow overflow-hidden border">
                {m.imageUrl && (
                  <div className="relative w-full h-48">
                    <Image src={m.imageUrl} alt={m.title || 'Memory'} fill className="object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{m.title}</h3>
                  {m.address && (
                    <p className="text-sm text-gray-500 line-clamp-1">{m.address}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{m.description || m.caption}</p>
                  <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                    <span suppressHydrationWarning>
                      {mounted
                        ? new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date(m.memoryDate || m.createdAt))
                        : ''}
                    </span>
                    <span>Lat: {m.latitude.toFixed(3)}, Lng: {m.longitude.toFixed(3)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-end space-x-2">
                    <Link
                      href={`/edit-memory/${m.id}`}
                      className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this memory? This cannot be undone.')) return;
                        const prev = memories;
                        setMemories((list) => list.filter((x) => x.id !== m.id));
                        try {
                          const res = await fetch(`/api/memories/${m.id}`, { method: 'DELETE' });
                          if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            throw new Error(data.error || 'Failed to delete');
                          }
                        } catch (e) {
                          alert(e instanceof Error ? e.message : 'Failed to delete');
                          setMemories(prev);
                        }
                      }}
                      className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
