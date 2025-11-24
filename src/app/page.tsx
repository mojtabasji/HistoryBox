'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/SuperTokensAuthContext';
import Link from 'next/link';
import type { Icon, Map as LeafletMapType } from 'leaflet';
import marker1x from 'leaflet/dist/images/marker-icon.png';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useMap } from 'react-leaflet';
import SearchControl from '../components/SearchControl';
import CoinsBadge from '@/components/CoinsBadge';
import { t } from '@/lib/i18n';
import { Spinner } from '@/components/Loading';

const LeafletMap = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Rectangle = dynamic(() => import('react-leaflet').then(m => m.Rectangle), { ssr: false });
import { decodeGeohashBox } from '@/lib/geohash';

type RegionMarker = {
  id: number;
  geohash: string;
  postCount: number;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  title?: string;
  description?: string | null;
};

type RegionsApiRegion = {
  id: number;
  geohash: string;
  postCount: number;
  sample?: { latitude?: number; longitude?: number; imageUrl?: string; title?: string; description?: string | null };
};

type RecentMemory = {
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

export default function Home() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [regions, setRegions] = useState<RegionMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapStyle = useMemo(() => ({ width: '100%', height: '100dvh' }), []);
  const [mapInstance, setMapInstance] = useState<LeafletMapType | null>(null);
  const [LRef, setLRef] = useState<typeof import('leaflet') | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [visibleRegions, setVisibleRegions] = useState<RegionMarker[]>([]);
  const [clusterTotals, setClusterTotals] = useState<Record<number, number>>({});
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const [unlockRequested, setUnlockRequested] = useState<Record<string, boolean>>({});
  const [zoomedToId, setZoomedToId] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecentMemory[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

  // Avoid SSR/client hydration mismatch by rendering map only after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load recent memories globally (not user-specific)
  useEffect(() => {
    let cancelled = false;
    const loadRecent = async () => {
      setRecentLoading(true);
      setRecentError(null);
      try {
        const res = await fetch('/api/memories/recent?limit=20', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load recent items');
        if (!cancelled) setRecent((data.memories || []) as RecentMemory[]);
      } catch (e) {
        if (!cancelled) setRecentError(e instanceof Error ? e.message : 'Failed to load recent items');
      } finally {
        if (!cancelled) setRecentLoading(false);
      }
    };
    loadRecent();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/regions');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load regions');
        const mapped: RegionMarker[] = (data.regions as RegionsApiRegion[]).map((r) => ({
          id: r.id,
          geohash: r.geohash,
          postCount: r.postCount,
          // If no sample coords, place roughly at equator for now
          latitude: r.sample?.latitude ?? 0,
          longitude: r.sample?.longitude ?? 0,
          imageUrl: r.sample?.imageUrl,
          title: r.sample?.title,
          description: r.sample?.description ?? null,
        }));
        setRegions(mapped);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load regions');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Recompute decluttered visible regions when map moves/zooms or data updates
  useEffect(() => {
    if (!mapInstance) {
      setVisibleRegions(regions);
      const totals: Record<number, number> = {};
      for (const r of regions) totals[r.id] = r.postCount;
      setClusterTotals(totals);
      return;
    }

    const RADIUS_PX = 80; // roughly matches our marker width/spacing

    const recompute = () => {
      try {
        // Optionally filter to current bounds for performance
        const b = mapInstance.getBounds();
        const inView = regions.filter((r) => b.contains([r.latitude, r.longitude] as [number, number]));
        // Prefer denser regions first
        const sorted = [...inView].sort((a, b) => b.postCount - a.postCount);
        const kept: RegionMarker[] = [];
        const points: { x: number; y: number }[] = [];
        const totals: number[] = [];
        for (const r of sorted) {
          const p = mapInstance.latLngToContainerPoint([r.latitude, r.longitude] as [number, number]);
          let collideIndex = -1;
          for (let i = 0; i < points.length; i++) {
            const dx = points[i].x - p.x;
            const dy = points[i].y - p.y;
            if (dx * dx + dy * dy < RADIUS_PX * RADIUS_PX) {
              collideIndex = i;
              break;
            }
          }
          if (collideIndex === -1) {
            kept.push(r);
            points.push({ x: p.x, y: p.y });
            totals.push(r.postCount);
          } else {
            // Aggregate hidden region's photos into the representative total
            totals[collideIndex] += r.postCount;
          }
        }
        setVisibleRegions(kept);
        // Map totals to region ids
        const totalsById: Record<number, number> = {};
        for (let i = 0; i < kept.length; i++) totalsById[kept[i].id] = totals[i] ?? kept[i].postCount;
        setClusterTotals(totalsById);
      } catch {
        setVisibleRegions(regions);
        const totals: Record<number, number> = {};
        for (const r of regions) totals[r.id] = r.postCount;
        setClusterTotals(totals);
      }
    };

    // Initial compute and on changes
    recompute();
    mapInstance.on('moveend', recompute);
    mapInstance.on('zoomend', recompute);
    // Clear any remembered zoomed-to marker when user moves/zooms
    const clearZoomed = () => setZoomedToId(null);
    mapInstance.on('moveend', clearZoomed);
    return () => {
      try {
        mapInstance.off('moveend', recompute);
        mapInstance.off('zoomend', recompute);
        mapInstance.off('moveend', clearZoomed);
      } catch {}
    };
  }, [mapInstance, regions]);

  // Setup Leaflet default icon on client
  const [defaultIcon, setDefaultIcon] = useState<Icon | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (!cancelled) setLRef(L);
      const icon = L.icon({
        iconUrl: marker1x as unknown as string,
        iconRetinaUrl: marker2x as unknown as string,
        shadowUrl: markerShadow as unknown as string,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      if (!cancelled) setDefaultIcon(icon);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // During SSR (not mounted yet), render a minimal shell to avoid mismatch
  if (!mounted) {
    return <div style={{ width: '100%', height: '100dvh', background: '#f8fafc' }} />;
  }

  return (
    <div className="relative w-full h-[100dvh]">
      {/* Full-screen Map */}
      <LeafletMap
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={19}
        style={mapStyle}
        scrollWheelZoom
        zoomControl={false}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        inertia={false}
        touchZoom={'center'}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Default zoom control removed; custom control rendered as overlay */}
        <MapInstanceSetter onReady={setMapInstance} />
        {(visibleRegions.length ? visibleRegions : regions).map((r) => {
          const totalCount = clusterTotals[r.id] ?? r.postCount;
          const captionHtml = totalCount
            ? `<div class="hb-caption rtl-num" style="margin-top:6px;padding:4px 10px;border-radius:16px;background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);font-size:11.5px;line-height:1.25;color:#111;white-space:nowrap;max-width:150px;text-overflow:ellipsis;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.35);font-weight:600;border:1px solid rgba(255,255,255,0.6)"><span style="background:#4f46e5;color:#fff;font-weight:700;padding:0 6px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.25);display:inline-block;text-align:center">${totalCount}</span> <span>${t('photosHere')}</span></div>`
            : `<div class="hb-caption rtl-num" style="margin-top:6px;padding:4px 10px;border-radius:16px;background:linear-gradient(135deg,#1e293b,#334155);font-size:11.5px;line-height:1.25;color:#fff;white-space:nowrap;max-width:150px;text-overflow:ellipsis;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.45);font-weight:600"><span style="display:inline-flex;align-items:center;gap:4px">🔒 ${t('hiddenPhotosHere')}</span></div>`;
          const thumb = r.imageUrl || '/vercel.svg';
          const icon = LRef
            ? LRef.divIcon({
                className: 'hb-marker',
                html: `
                  <div class="hb-pin" style="display:inline-flex;flex-direction:column;align-items:center;">
                    <div class="hb-bubble" style="width:130px;height:80px;border-radius:14px;box-shadow:0 8px 20px rgba(0,0,0,0.28);background:#fff;overflow:hidden;border:1px solid rgba(255,255,255,0.4)">
                      <div class="hb-img" style="width:100%;height:100%;background-size:cover;background-position:center;background-image:url('${thumb}')"></div>
                    </div>
                    <div class="hb-arrow" style="width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:12px solid #ffffff;filter:drop-shadow(0 3px 4px rgba(0,0,0,0.25));margin-top:-2px"></div>
                    ${captionHtml}
                  </div>
                `,
                iconSize: [96, 84],
                iconAnchor: [48, 84],
              })
            : (defaultIcon ?? undefined);
          const truncate = (text: string | null | undefined, n = 5) => {
            const t = (text ?? '').trim();
            if (!t) return '';
            const parts = t.split(/\s+/).filter(Boolean);
            if (parts.length <= n) return t;
            return parts.slice(0, n).join(' ');
          };

          const onPopupOpen = async () => {
            if (!user) return; // only check unlock when signed in
            const key = r.geohash;
            if (unlocked[key] !== undefined || unlockRequested[key]) return;
            setUnlockRequested((m) => ({ ...m, [key]: true }));
            try {
              const res = await fetch(`/api/regions/${key}/posts`, { cache: 'no-store' });
              if (res.ok) {
                const data = await res.json();
                setUnlocked((m) => ({ ...m, [key]: !!data?.unlocked }));
              }
            } catch {
              // ignore failures; treat as locked
            } finally {
              setUnlockRequested((m) => ({ ...m, [key]: false }));
            }
          };

          const isUnlocked = !!unlocked[r.geohash];

          return (
            <Marker
              key={r.id}
              position={[r.latitude, r.longitude] as [number, number]}
              icon={icon as Icon | undefined}
              eventHandlers={{
                popupopen: onPopupOpen,
                click: (e: unknown) => {
                  const ev = e as { target?: { closePopup?: () => void } };
                  try {
                    if (!mapInstance) return;
                    const total = clusterTotals[r.id] ?? r.postCount;
                    const combined = total > r.postCount;
                    const currentZoom = mapInstance.getZoom?.() ?? 0;
                    const zoomThreshold = 12;
                    if (combined && zoomedToId !== r.id && currentZoom < zoomThreshold) {
                          const targetZoom = Math.min(20, Math.max(currentZoom + 4, zoomThreshold));
                      // Zoom first and make sure popup does not remain open on this click
                      mapInstance.flyTo([r.latitude, r.longitude], targetZoom, { duration: 0.9 });
                      try { ev.target?.closePopup?.(); } catch {}
                      setZoomedToId(r.id);
                      setTimeout(() => setZoomedToId(null), 6000);
                    }
                  } catch {
                    // ignore
                  }
                },
              }}
            >
              <Popup>
                <div className="w-56">
                  {r.imageUrl && (
                    <div className="mb-2 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.imageUrl} alt={r.title || 'memory'} className={`w-full h-32 object-cover rounded ${isUnlocked ? '' : 'blur-sm select-none'}`} />
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-xs bg-black/40 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            {unlockRequested[r.geohash] ? (<><Spinner size="sm" /><span>{t('checking')}</span></>) : t('lockedPreview')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="font-semibold text-sm mb-1">{r.title || t('memory')}</div>
                  <div className="text-xs text-gray-700">
                    {isUnlocked ? (truncate(r.description || r.title, 5)) : (truncate(r.description || r.title, 5) + ' ' + t('lockedSuffix'))}
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={async () => {
                        try {
                          if (!mapInstance) {
                            window.location.href = `/region/${r.geohash}`;
                            return;
                          }
                          const total = clusterTotals[r.id] ?? r.postCount;
                          const combined = total > r.postCount;
                          const currentZoom = mapInstance.getZoom?.() ?? 0;
                          const zoomThreshold = 10;
                          if (combined && zoomedToId !== r.id && currentZoom < zoomThreshold) {
                            const targetZoom = Math.min(17, Math.max(currentZoom + 4, zoomThreshold));
                            mapInstance.flyTo([r.latitude, r.longitude], targetZoom, { duration: 0.9 });
                            setZoomedToId(r.id);
                            setTimeout(() => setZoomedToId(null), 6000);
                            return;
                          }
                          window.location.href = `/region/${r.geohash}`;
                        } catch {
                          window.location.href = `/region/${r.geohash}`;
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                      aria-label={isUnlocked ? t('show') : t('unlock')}
                    >
                      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='w-4 h-4'>
                        <path d='M12 5v14M5 12h14' strokeLinecap='round' />
                      </svg>
                      <span className='rtl-num'>{isUnlocked ? t('show') : t('unlock')}</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Optional: region grid rectangles */}
        {showGrid && regions.map((r) => {
          try {
            const [minLat, minLng, maxLat, maxLng] = decodeGeohashBox(r.geohash);
            const bounds: [[number, number], [number, number]] = [[minLat, minLng], [maxLat, maxLng]];
            return (
              <Rectangle
                key={`rect-${r.id}`}
                bounds={bounds}
                pathOptions={{
                  color: '#1148e2e3',
                  weight: 1.5,
                  opacity: 0.9,
                  dashArray: '3 2',
                  fill: true,
                  fillColor: '#858b96d5',
                  fillOpacity: 0.08,
                }}
              />
            );
          } catch {
            return null;
          }
        })}
      </LeafletMap>

      {/* Top overlay header */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 p-3 z-[1000]">
        <div className="grid grid-cols-3 items-center gap-3">
          {/* Left: Logo + App name */}
          <div className="pointer-events-auto flex items-center gap-2 btn-h">
            <Link href="/" className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white shadow font-bold select-none btn-h btn-w">HB</Link>
            <span className="flex items-center leading-none text-xl md:text-2xl font-bold tracking-wide text-indigo-700 select-none btn-h font-fa">{t('historyBox')}</span>
          </div>

          {/* Center: Search */}
          <div className="pointer-events-auto justify-self-center hidden md:block">
            <SearchControl map={mapInstance} className="w-[min(92vw,420px)] btn-h" />
          </div>

          {/* Right: Square icon buttons */}
          <div className="pointer-events-auto justify-self-end flex items-center gap-2 z-[1001]">
            {/* Grid toggle icon button */}
            <button
              onClick={() => setShowGrid((s) => !s)}
              className={`btn-h btn-w rounded-md shadow-md flex items-center justify-center transition-colors ${showGrid ? 'bg-indigo-600 text-white' : 'bg-white/80 backdrop-blur text-gray-800 hover:bg-white'}`}
              title={showGrid ? t('hideGrid') : t('showGrid')}
              aria-label={showGrid ? t('hideGrid') : t('showGrid')}
              aria-pressed={showGrid}
            >
              {/* grid icon */}
              {showGrid ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                  <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-gray-700">
                  <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
                </svg>
              )}
              {/* active dot indicator */}
              {showGrid && <span className="absolute top-1 right-1 h-2 w-2 bg-white rounded-full" aria-hidden="true" />}
            </button>

                {user ? (
                  <>
                    <Link href="/dashboard" className="h-10 inline-flex items-center px-3 rounded-md shadow-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm btn-h" title="Dashboard" aria-label="Dashboard">
                      {t('dashboard')}
                    </Link>
                    <Link href="/add-memory" className="h-10 inline-flex items-center px-3 rounded-md shadow-md bg-green-600 hover:bg-green-700 text-white text-sm btn-h" title="Add Memory" aria-label="Add Memory">
                      {t('addMemory')}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="h-10 inline-flex items-center px-3 rounded-md shadow-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm btn-h">{t('signIn')}</Link>
                    <Link href="/signup" className="h-10 inline-flex items-center px-3 rounded-md shadow-md bg-green-600 hover:bg-green-700 text-white text-sm btn-h">{t('createAccount')}</Link>
                  </>
                )}
          </div>
        </div>
      </div>

  {/* Locate me button */}
  <LocateMe map={mapInstance} />

  {/* Custom zoom controls */}
  <CustomZoom map={mapInstance} />

      {/* Left: Recent items list (md+) */}
      <div className="pointer-events-none absolute left-0 top-20 p-3 z-[1000] hidden md:block mx-h-6">
        <div className="pointer-events-auto w-72 h-full bg-white/80 backdrop-blur rounded-lg shadow-md overflow-hidden flex flex-col">
          <div className="px-3 py-2 text-sm font-semibold text-gray-800">{t('recentLocations')}</div>
          <div className="flex-1 overflow-auto">
            {recentLoading && (
              <div className="p-3 text-sm text-gray-600">{t('loadingEllipsis')}</div>
            )}
            {recentError && (
              <div className="p-3 text-sm text-yellow-800 bg-yellow-50">{recentError}</div>
            )}
            {!recentLoading && !recentError && recent.length === 0 && (
              <div className="p-3 text-sm text-gray-600">{t('noRecentItems')}</div>
            )}
            {recent.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  try {
                    if (mapInstance) {
                      mapInstance.flyTo([m.latitude, m.longitude] as [number, number], Math.max(mapInstance.getZoom?.() ?? 2, 14), { duration: 0.9 });
                    }
                  } catch {}
                }}
                className="w-full text-left px-2 py-2 hover:bg-gray-50 flex items-center gap-2"
                title={m.title}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.imageUrl} alt={m.title || 'memory'} className="h-10 w-14 object-cover rounded" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 line-clamp-1">{m.title || 'Memory'}</div>
                  <div className="text-[11px] text-gray-600 line-clamp-1 rtl-num" suppressHydrationWarning>
                    {new Intl.DateTimeFormat('fa-IR', { timeZone: 'UTC' }).format(new Date(m.memoryDate || m.createdAt))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coins badge shown under header (page-only) */}
      <div className="pointer-events-auto absolute top-16 right-3 z-[1000]">
        <CoinsBadge rect />
      </div>

      {/* Bottom overlay hint */}
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 p-3 z-[1000]">
        <div className="pointer-events-auto mx-auto max-w-md bg-white/80 backdrop-blur rounded-lg shadow px-4 py-3 text-sm text-gray-800">
          {error ? (
            <div className="text-red-700">{error}</div>
          ) : (
            <div className="flex items-center justify-between gap-2" dir='rtl'>
              <span className="font-medium">{t('exploreWorld')}</span>
              <span className="text-gray-600 rtl-num">{loading ? t('loadingRegions') : `${regions.length} ${t('regionsWithHiddenPhotos')}`}</span>
            </div>
          )}
        </div>
        {/* Mobile search below */}
        <div className="mt-2 md:hidden">
          <SearchControl map={mapInstance} />
        </div>
      </div>
    </div>
  );
}
// Helper component to capture map instance once available
function MapInstanceSetter({ onReady }: { onReady: (map: LeafletMapType) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}
// Floating button to center map on user's current location
function LocateMe({ map }: { map: LeafletMapType | null }) {
  const [locating, setLocating] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const onClick = () => {
    setErr(null);
    if (!map) {
      setErr(t('mapNotReady'));
      return;
    }
    if (!('geolocation' in navigator)) {
      setErr(t('geolocationUnsupported'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], Math.max(map.getZoom?.() ?? 2, 15), { duration: 1.0 });
        (async () => {
          const L = await import('leaflet');
          const marker = L.circleMarker([latitude, longitude], {
            radius: 8,
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.6,
            weight: 2,
          }).addTo(map);
          setTimeout(() => {
            try { map.removeLayer(marker); } catch {}
          }, 4000);
        })();
        setLocating(false);
      },
      (e) => {
        setLocating(false);
        setErr(e.message || t('locationFailed'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="absolute right-3 bottom-35 z-[1000] flex flex-col items-end gap-2">
      {err && (
        <div className="bg-white/90 backdrop-blur text-red-700 text-xs rounded px-2 py-1 shadow max-w-[70vw]">
          {err}
        </div>
      )}
      <button
        onClick={onClick}
        className="btn-h btn-w bg-white/80 text-gray-800 rounded-md shadow-md flex items-center justify-center focus:outline-none hover:bg-white"
        title={t('goToMyLocation')}
        aria-label={t('goToMyLocation')}
      >
        {locating ? (
          <Spinner size="md" />
        ) : (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3v2M12 19v2M21 12h-2M5 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// Custom zoom control overlay
function CustomZoom({ map }: { map: LeafletMapType | null }) {
  const onZoomIn = () => {
    try { map?.zoomIn(); } catch {}
  };
  const onZoomOut = () => {
    try { map?.zoomOut(); } catch {}
  };
  return (
    <div className="absolute right-3 bottom-10 z-[1000] flex flex-col items-end gap-2">
      <div className="flex flex-col gap-2">
        <button
          onClick={onZoomIn}
          className="btn-h btn-w bg-white/80 text-gray-800 rounded-md shadow-md flex items-center justify-center hover:bg-white"
          title={t('zoomIn')}
          aria-label={t('zoomIn')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
        </button>
        <button
          onClick={onZoomOut}
          className="btn-h btn-w bg-white/80 text-gray-800 rounded-md shadow-md flex items-center justify-center hover:bg-white"
          title={t('zoomOut')}
          aria-label={t('zoomOut')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
