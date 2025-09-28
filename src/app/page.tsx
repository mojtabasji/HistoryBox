'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import type { Icon, Map as LeafletMapType } from 'leaflet';
import marker1x from 'leaflet/dist/images/marker-icon.png';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useMap } from 'react-leaflet';
import SearchControl from '../components/SearchControl';

const LeafletMap = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const ZoomControl = dynamic(() => import('react-leaflet').then(m => m.ZoomControl), { ssr: false });
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

  // Avoid SSR/client hydration mismatch by rendering map only after mount
  useEffect(() => {
    setMounted(true);
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
        <ZoomControl position="bottomright" />
        <MapInstanceSetter onReady={setMapInstance} />
        {regions.map((r) => {
          const caption = r.postCount ? `${r.postCount} photos here` : 'Hidden photos here';
          const thumb = r.imageUrl || '/vercel.svg';
          const icon = LRef
            ? LRef.divIcon({
                className: 'hb-marker',
                html: `
                  <div class="hb-pin" style="display:inline-flex;flex-direction:column;align-items:center;">
                    <div class="hb-bubble" style="width:96px;height:64px;border-radius:12px;box-shadow:0 6px 16px rgba(0,0,0,0.25);background:#fff;overflow:hidden;border:1px solid rgba(0,0,0,0.1)">
                      <div class="hb-img" style="width:100%;height:100%;background-size:cover;background-position:center;background-image:url('${thumb}')"></div>
                    </div>
                    <div class="hb-arrow" style="width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:10px solid #ffffff;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.2));margin-top:-1px"></div>
                    <div class="hb-caption" style="margin-top:6px;padding:2px 8px;border-radius:9999px;background:rgba(255,255,255,0.95);backdrop-filter:blur(4px);font-size:11px;line-height:1.1;color:#111;white-space:nowrap;max-width:120px;text-overflow:ellipsis;overflow:hidden;border:1px solid rgba(0,0,0,0.08)">${caption}</div>
                  </div>
                `,
                iconSize: [96, 84],
                iconAnchor: [48, 84],
              })
            : (defaultIcon ?? undefined);
          return (
            <Marker key={r.id} position={[r.latitude, r.longitude] as [number, number]} icon={icon as Icon | undefined}>
              {user && (
                <Popup>
                  <div className="w-56">
                    {r.imageUrl && (
                      <div className="mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.imageUrl} alt={r.title || 'memory'} className="w-full h-32 object-cover rounded" />
                      </div>
                    )}
                    <div className="font-semibold text-sm mb-1">{r.title || 'Memory'}</div>
                    {r.description && (
                      <div className="text-xs text-gray-700 line-clamp-3">{r.description}</div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Link href="/add-memory" className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs">Add Memory</Link>
                      <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs">My Memories</Link>
                    </div>
                  </div>
                </Popup>
              )}
              {!user && (
                <Popup>
                  <div className="w-56">
                    <div className="text-sm font-medium mb-1">Locked Region</div>
                    <div className="text-xs text-gray-700 mb-2">Sign in to view details</div>
                    <div className="flex gap-2">
                      <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs">Sign In</Link>
                      <Link href="/signup" className="bg-white/80 backdrop-blur border text-gray-700 px-2 py-1 rounded text-xs">Create Account</Link>
                    </div>
                  </div>
                </Popup>
              )}
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

      {/* Top overlay bar */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 p-3 z-[1000]">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
          {/* Left: Search on desktop */}
          <div className="hidden md:block pointer-events-auto">
            <SearchControl map={mapInstance} />
          </div>
          {/* Center: App name */}
          <div className="justify-self-center">
            <div className="pointer-events-auto select-none bg-white/70 backdrop-blur rounded-full px-4 py-1 shadow">
              <span className="text-2xl font-bold tracking-wide text-indigo-700">History Box</span>
            </div>
          </div>
          {/* Right: Auth actions */}
          <div className="pointer-events-auto justify-self-end flex items-center gap-2 z-[1001]">
            <button
              onClick={() => setShowGrid((s) => !s)}
              className={`px-3 py-1 rounded text-sm shadow border ${showGrid ? 'bg-white text-gray-700' : 'bg-white/80 backdrop-blur text-gray-700'}`}
              title="Toggle region grid"
            >
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </button>
            {user ? (
              <>
                <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm shadow">Dashboard</Link>
                <Link href="/add-memory" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm shadow">Add Memory</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm shadow">Sign In</Link>
                <Link href="/signup" className="bg-white/80 backdrop-blur border text-gray-700 px-3 py-1 rounded text-sm shadow">Create Account</Link>
              </>
            )}
          </div>
        </div>
      </div>

  {/* Locate me button */}
  <LocateMe map={mapInstance} />

      {/* Bottom overlay hint */}
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 p-3 z-[1000]">
        <div className="pointer-events-auto mx-auto max-w-md bg-white/80 backdrop-blur rounded-lg shadow px-4 py-3 text-sm text-gray-800">
          {error ? (
            <div className="text-red-700">{error}</div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">Explore the World</span>
              <span className="text-gray-600">{loading ? 'Loading regions…' : `${regions.length} regions with hidden photos`}</span>
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
      setErr('Map is not ready yet');
      return;
    }
    if (!('geolocation' in navigator)) {
      setErr('Geolocation not supported');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Smooth animate to location
        map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), { duration: 1.0 });
        // Drop a temporary pulse marker
        (async () => {
          const L = await import('leaflet');
          const marker = L.circleMarker([latitude, longitude], {
            radius: 8,
            color: '#2563eb', // indigo-600
            fillColor: '#3b82f6', // blue-500
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
        setErr(e.message || 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="absolute right-3 bottom-24 z-[1000] flex flex-col items-end gap-2">
      {err && (
        <div className="bg-white/90 backdrop-blur text-red-700 text-xs rounded px-2 py-1 shadow max-w-[70vw]">
          {err}
        </div>
      )}
      <button
        onClick={onClick}
        className="h-11 w-11 bg-white text-gray-700 rounded-full shadow flex items-center justify-center focus:outline-none hover:bg-gray-50"
        title="Go to my location"
        aria-label="Go to my location"
      >
        {locating ? (
          <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
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
