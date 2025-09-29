'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Loading, { Spinner } from '@/components/Loading';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type ApiPost = {
  id: number;
  imageUrl: string;
  caption?: string | null;
  description?: string | null;
  createdAt?: string;
  blurred?: boolean;
};

type ApiResponse = {
  region: { id: number; hash: string; postCount: number };
  unlocked: boolean;
  posts: ApiPost[];
  canUnlock: boolean;
};

export default function RegionPage() {
  const params = useParams<{ hash: string }>();
  const regionHash = params.hash;
  const router = useRouter();
  const { user, setCoins: setGlobalCoins } = useAuth();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [checkingUnlock, setCheckingUnlock] = useState(false);
  const [coins, setLocalCoins] = useState<number | null>(null);
  const [viewerPost, setViewerPost] = useState<ApiPost | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = React.useRef<{ x: number; y: number } | null>(null);
  // index-based slider; we derive current index from viewerPost

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/regions/${regionHash}/posts`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load region');
      setData(json as ApiResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load region');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (regionHash) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionHash]);

  const needsMore = useMemo(() => {
    if (!data) return false;
    return data.posts.length < (data.region.postCount || 0);
  }, [data]);

  const onUnlock = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setUnlocking(true);
    try {
      const res = await fetch('/api/regions/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regionHash }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unlock failed');
  if (typeof json.coins === 'number') { setLocalCoins(json.coins); setGlobalCoins(json.coins); }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unlock failed');
    } finally {
      setUnlocking(false);
    }
  };

  // Check unlock status explicitly when user is present (optional double-check for SSR races)
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!user || !regionHash) return;
      setCheckingUnlock(true);
      try {
        const res = await fetch(`/api/regions/${regionHash}/posts`, { cache: 'no-store' });
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          setData(json as ApiResponse);
        }
      } catch { /* ignore */ }
      finally {
        if (!cancelled) setCheckingUnlock(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [user, regionHash]);

  // Close viewer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerPost(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Reset zoom/pan when opening a new post
  useEffect(() => {
    if (viewerPost) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setIsPanning(false);
      panStart.current = null;
    }
  }, [viewerPost]);

  // Build unlocked posts timeline (sorted by date; fallback to index when date missing)
  const timeline = useMemo(() => {
    if (!data) return { items: [] as { post: ApiPost; t: number }[], min: 0, max: 0, hasDates: false };
    const unlockedPosts = (data.posts || []).filter((p) => !p.blurred);
  const hasDates = unlockedPosts.some((p) => p.createdAt && !Number.isNaN(Date.parse(p.createdAt)));
    const items = unlockedPosts.map((p, i) => ({ post: p, t: p.createdAt && !Number.isNaN(Date.parse(p.createdAt)) ? Date.parse(p.createdAt!) : i }));
    items.sort((a, b) => a.t - b.t);
    const min = items.length ? items[0].t : 0;
    const max = items.length ? items[items.length - 1].t : 0;
    return { items, min, max, hasDates };
  }, [data]);

  // No separate state needed for slider value; use currentIndex derived below

  const currentIndex = useMemo(() => {
    if (!viewerPost || !timeline.items.length) return -1;
    return timeline.items.findIndex((it) => it.post.id === viewerPost.id);
  }, [viewerPost, timeline.items]);

  const jumpToIndex = (idx: number) => {
    if (!timeline.items.length) return;
    const clamped = Math.max(0, Math.min(timeline.items.length - 1, idx));
    const target = timeline.items[clamped];
    if (target) {
      setViewerPost(target.post);
    }
  };
  const onTimelineIndexChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const idx = Number(e.target.value);
    if (Number.isNaN(idx)) return;
    jumpToIndex(idx);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-700 hover:text-gray-900 text-sm">← Back to map</Link>
            {data && (
              <div className="text-gray-900 font-semibold">Region {data.region.hash}</div>
            )}
          </div>
          {coins !== null && (
            <div className="text-sm text-gray-700">Your coins: <span className="font-semibold">{coins}</span></div>
          )}
        </div>
      </nav>

  <main className="relative max-w-6xl mx-auto px-4 py-6">
  {loading && <Loading label="Loading region…" variant="inset" />}
        {error && <div className="text-red-700">{error}</div>}
        {data && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">{data.region.postCount} total posts</div>
              {!data.unlocked && (
                <button onClick={onUnlock} disabled={unlocking} className={`px-3 py-2 rounded text-white text-sm inline-flex items-center gap-2 ${unlocking ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {unlocking && <Spinner size="sm" />}
                  <span>🔒 Unlock region (2 coins)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.posts.map((p) => {
                const openViewer = () => {
                  if (p.blurred) {
                    // Prompt unlock instead of opening viewer
                    void onUnlock();
                  } else {
                    setViewerPost(p);
                  }
                };
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={openViewer}
                    className="text-left bg-white rounded-lg shadow overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <div className="relative h-48">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt="memory" className={`w-full h-full object-cover ${p.blurred ? 'blur-md select-none' : ''}`} />
                      {p.blurred && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="bg-white/90 backdrop-blur px-3 py-1 rounded text-sm">Locked preview</div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 text-sm text-gray-800">
                      <div className="font-medium mb-1">{p.caption || 'Memory'}</div>
                      {p.description && <div className="text-xs text-gray-600 line-clamp-2">{p.description}</div>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-center">
              {needsMore && (
                <button onClick={onUnlock} disabled={unlocking || !user} className={`px-4 py-2 rounded text-white text-sm inline-flex items-center gap-2 ${unlocking ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {unlocking && <Spinner size="sm" />}
                  <span>{user ? 'Unlock more posts (2 coins)' : 'Sign in to unlock'}</span>
                </button>
              )}
            </div>
          </>
        )}
        {(unlocking || checkingUnlock) && (
          <div className="absolute inset-0"><Loading variant="cover" label={unlocking ? 'Unlocking…' : 'Checking status…'} /></div>
        )}
      </main>

      {/* Full-screen image viewer */}
      {viewerPost && (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center" onClick={() => setViewerPost(null)}>
          <div className="relative w-full h-full p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
            {/* Close button visible in the top-right */}
            <button
              onClick={() => setViewerPost(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full px-3 py-1 text-sm"
              aria-label="Close"
            >
              Close ✕
            </button>

            <div className="flex flex-col items-center h-full">
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden select-none"
                onWheel={(e) => {
                  // Zoom with wheel, centered (simple)
                  e.preventDefault();
                  const delta = -e.deltaY; // up = zoom in
                  setZoom((z) => {
                    const next = Math.min(6, Math.max(1, z + delta * 0.0015));
                    if (next === 1) setOffset({ x: 0, y: 0 });
                    return next;
                  });
                }}
                onMouseDown={(e) => {
                  if (zoom <= 1) return; // only pan when zoomed
                  setIsPanning(true);
                  panStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
                }}
                onMouseMove={(e) => {
                  if (!isPanning || zoom <= 1 || !panStart.current) return;
                  const nx = e.clientX - panStart.current.x;
                  const ny = e.clientY - panStart.current.y;
                  setOffset({ x: nx, y: ny });
                }}
                onMouseUp={() => { setIsPanning(false); panStart.current = null; }}
                onMouseLeave={() => { setIsPanning(false); panStart.current = null; }}
                onDoubleClick={() => {
                  // Quick zoom toggle
                  setZoom((z) => (z > 1 ? 1 : 2));
                  if (zoom > 1) setOffset({ x: 0, y: 0 });
                }}
                role="presentation"
                style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewerPost.imageUrl}
                  alt={viewerPost.caption || 'memory'}
                  className="max-h-[95vh] max-w-[98vw] w-auto h-auto object-contain rounded shadow-lg"
                  style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transition: isPanning ? 'none' : 'transform 120ms ease-out', transformOrigin: 'center center' }}
                />
              </div>

              <div className="mt-3 w-full max-w-[96vw] text-white">
                <div className="text-lg font-semibold">{viewerPost.caption || 'Memory'}</div>
                {viewerPost.description && (
                  <div className="mt-1 text-sm text-white/90 whitespace-pre-line">{viewerPost.description}</div>
                )}
              </div>

              {/* Zoom controls */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full h-9 w-9 flex items-center justify-center text-lg"
                  aria-label="Zoom out"
                >−</button>
                <button
                  onClick={() => setZoom((z) => Math.min(6, z + 0.5))}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full h-9 w-9 flex items-center justify-center text-lg"
                  aria-label="Zoom in"
                >+</button>
                <button
                  onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full px-3 h-9 flex items-center justify-center text-sm"
                  aria-label="Reset zoom"
                >Reset</button>
              </div>

              {/* Timeline slider (center bottom) */}
              {timeline.items.length > 1 && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-4 pr-36 pl-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 text-white shadow border border-white/10 w-[min(92vw,720px)]">
                    <div className="flex items-center justify-between text-xs mb-2 opacity-90">
                      <div>Timeline</div>
                      <div>
                        {timeline.hasDates
                          ? (currentIndex >= 0 ? new Date(timeline.items[currentIndex].t).toLocaleDateString() : '—')
                          : `${Math.max(1, currentIndex + 1)} / ${timeline.items.length}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="bg-white/20 hover:bg-white/30 text-white rounded px-2 py-1 text-xs"
                        onClick={() => jumpToIndex((currentIndex === -1 ? timeline.items.length - 1 : currentIndex) - 1)}
                        aria-label="Previous"
                      >Prev</button>
                      <input
                        type="range"
                        className="flex-1 accent-indigo-400"
                        min={0}
                        max={Math.max(0, timeline.items.length - 1)}
                        step={1}
                        value={currentIndex >= 0 ? currentIndex : Math.max(0, timeline.items.length - 1)}
                        onChange={onTimelineIndexChange}
                        onInput={(e) => onTimelineIndexChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
                      />
                      <button
                        className="bg-white/20 hover:bg-white/30 text-white rounded px-2 py-1 text-xs"
                        onClick={() => jumpToIndex((currentIndex === -1 ? 0 : currentIndex) + 1)}
                        aria-label="Next"
                      >Next</button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 text-[11px] text-white/90">
                      <div className="justify-self-start">
                        {timeline.hasDates ? new Date(timeline.items[0].t).toLocaleDateString() : '1'}
                      </div>
                      <div className="justify-self-center">
                        {timeline.hasDates
                          ? (currentIndex >= 0 ? new Date(timeline.items[currentIndex].t).toLocaleDateString() : '—')
                          : `${Math.max(1, currentIndex + 1)}`}
                      </div>
                      <div className="justify-self-end">
                        {timeline.hasDates ? new Date(timeline.items[timeline.items.length - 1].t).toLocaleDateString() : String(timeline.items.length)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
