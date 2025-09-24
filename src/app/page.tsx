'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import type { Icon, Map as LeafletMapType } from 'leaflet';
import marker1x from 'leaflet/dist/images/marker-icon.png';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useMap } from 'react-leaflet';

const LeafletMap = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

type RegionMarker = {
  id: number;
  geohash: string;
  postCount: number;
  latitude: number;
  longitude: number;
  imageUrl?: string;
};

type RegionsApiRegion = {
  id: number;
  geohash: string;
  postCount: number;
  sample?: { latitude?: number; longitude?: number; imageUrl?: string };
};

export default function Home() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [regions, setRegions] = useState<RegionMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapStyle = useMemo(() => ({ width: '100%', height: '100dvh' }), []);
  const [mapInstance, setMapInstance] = useState<LeafletMapType | null>(null);

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
      <LeafletMap center={[20, 0]} zoom={2} style={mapStyle} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInstanceSetter onReady={setMapInstance} />
        {regions.map((r) => (
          <Marker key={r.id} position={[r.latitude, r.longitude] as [number, number]} icon={defaultIcon ?? undefined}>
            <Popup>
              <div className="p-1 max-w-xs">
                <h3 className="font-semibold text-base mb-1">Locked Region</h3>
                <p className="text-sm text-gray-600 mb-2">There are {r.postCount} hidden photos here.</p>
                {r.imageUrl && (
                  <div className="relative w-full h-32 mb-2">
                    <Image src={r.imageUrl} alt="teaser" fill className="object-cover rounded" />
                  </div>
                )}
                {user ? (
                  <div className="flex gap-2">
                    <Link href={`/map`} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm">View Map</Link>
                    <Link href={`/add-memory`} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">Post a Photo</Link>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm">Unlock Now</Link>
                    <Link href="/signup" className="bg-white/80 backdrop-blur border text-gray-700 px-3 py-1 rounded text-sm">Sign up</Link>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </LeafletMap>

      {/* Top overlay bar */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-[1000]">
        {/* Centered app name */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="pointer-events-auto select-none bg-white/70 backdrop-blur rounded-full px-4 py-1 shadow">
            <span className="text-2xl font-bold tracking-wide text-indigo-700">History Box</span>
          </div>
        </div>
        <div className="pointer-events-auto ml-auto flex gap-2">
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
    <div className="absolute right-3 bottom-20 z-[1000] flex flex-col items-end gap-2">
      {err && (
        <div className="bg-white/90 backdrop-blur text-red-700 text-xs rounded px-2 py-1 shadow max-w-[70vw]">
          {err}
        </div>
      )}
      <button
        onClick={onClick}
        className="bg-white text-gray-800 rounded-full shadow px-4 py-2 text-sm focus:outline-none hover:bg-gray-50"
        title="Go to my location"
      >
        {locating ? 'Locating…' : 'My location'}
      </button>
    </div>
  );
}
