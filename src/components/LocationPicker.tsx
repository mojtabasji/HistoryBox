'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
// Leaflet CSS is imported globally in src/app/globals.css
import type { LeafletMouseEvent, Icon } from 'leaflet';
import dynamic from 'next/dynamic';
import marker1x from 'leaflet/dist/images/marker-icon.png';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
const LeafletMap = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  initialLocation?: { lat: number; lng: number };
  className?: string;
}

// const containerStyle = { width: '100%', height: '400px' };

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

// Create marker icon on the client to avoid SSR window reference
function useLeafletDefaultIcon() {
  const [icon, setIcon] = useState<Icon | null>(null);
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (typeof window === 'undefined') return;
      const L = await import('leaflet');
      const newIcon = L.icon({
        iconUrl: (marker1x as unknown as string),
        iconRetinaUrl: (marker2x as unknown as string),
        shadowUrl: (markerShadow as unknown as string),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      if (mounted) setIcon(newIcon);
    }
    load();
    return () => { mounted = false; };
  }, []);
  return icon;
}

const ClickHandler = dynamic(async () => {
  const { useMapEvents } = await import('react-leaflet');
  function Component({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
      click(e: LeafletMouseEvent) {
        onPick(e.latlng.lat, e.latlng.lng);
      },
    });
    return <></>;
  }
  return Component;
}, { ssr: false });

export default function LocationPicker({ 
  onLocationSelect, 
  initialLocation = defaultCenter,
  className = ''
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation
  );

  const style = useMemo(() => ({ width: '100%', height: '400px' }), []);
  const defaultIcon = useLeafletDefaultIcon();

  const handlePick = useCallback(async (lat: number, lng: number) => {
    const location = { lat, lng };
    setSelectedLocation(location);

    // Optional reverse geocoding via Nominatim (rate-limited)
    let address: string | undefined;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'history_box/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        address = data.display_name;
      }
    } catch {
      // ignore
    }
    onLocationSelect({ ...location, address });
  }, [onLocationSelect]);

  return (
    <div className={className}>
      <div className="mb-2">
        <p className="text-sm text-gray-600">Click on the map to select a location for your memory</p>
      </div>
      <LeafletMap center={[selectedLocation?.lat ?? initialLocation.lat, selectedLocation?.lng ?? initialLocation.lng]} zoom={10} style={style} scrollWheelZoom>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onPick={handlePick} />
        {selectedLocation && (
          defaultIcon ? (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={defaultIcon} />
          ) : (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
          )
        )}
      </LeafletMap>
      {selectedLocation && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
          Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
