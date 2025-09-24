'use client';

import React, { useCallback, useMemo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
// Leaflet CSS is imported globally in src/app/globals.css
import type { Icon } from 'leaflet';
import marker1x from 'leaflet/dist/images/marker-icon.png';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const LeafletMap = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

export interface Post {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  date?: string;
  imageUrl?: string;
}

interface MapProps {
  posts: Post[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (post: Post) => void;
  className?: string;
}

// const containerStyle = { width: '100%', height: '80vh' };

const defaultCenter = {
  lat: 40.7128, // New York City
  lng: -74.0060
};

function useLeafletDefaultIcon() {
  const [icon, setIcon] = React.useState<Icon | null>(null);
  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (typeof window === 'undefined') return;
      const L = await import('leaflet');
      const newIcon = L.icon({
        iconUrl: marker1x as unknown as string,
        iconRetinaUrl: marker2x as unknown as string,
        shadowUrl: markerShadow as unknown as string,
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

export default function Map({ 
  posts, 
  center = defaultCenter, 
  zoom = 2, 
  onMarkerClick,
  className = ''
}: MapProps) {
  const handleMarkerClick = useCallback((post: Post) => {
    onMarkerClick?.(post);
  }, [onMarkerClick]);

  const mapStyle = useMemo(() => ({ width: '100%', height: '80vh' }), []);
  const defaultIcon = useLeafletDefaultIcon();

  return (
    <div className={className}>
      <LeafletMap center={[center.lat, center.lng]} zoom={zoom} style={mapStyle} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {posts.map((post) => (
          <Marker key={post.id} position={[post.latitude, post.longitude]} icon={defaultIcon ?? undefined} eventHandlers={{ click: () => handleMarkerClick(post) }}>
            <Popup>
              <div className="p-1 max-w-xs">
                <h3 className="font-semibold text-base mb-1">{post.title || `Post ${post.id}`}</h3>
                {post.date && <p className="text-xs text-gray-600 mb-1">{post.date}</p>}
                {post.description && <p className="text-xs mb-2">{post.description}</p>}
                {post.imageUrl && (
                  <Image src={post.imageUrl} alt={post.title || 'Post image'} width={200} height={128} className="w-full h-32 object-cover rounded" />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </LeafletMap>
    </div>
  );
}
