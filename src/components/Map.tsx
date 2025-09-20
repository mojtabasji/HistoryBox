'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

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

const containerStyle = {
  width: '100%',
  height: '80vh'
};

const defaultCenter = {
  lat: 40.7128, // New York City
  lng: -74.0060
};

export default function Map({ 
  posts, 
  center = defaultCenter, 
  zoom = 2, 
  onMarkerClick,
  className = ''
}: MapProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  const handleMarkerClick = useCallback((post: Post) => {
    setSelectedPost(post);
    onMarkerClick?.(post);
  }, [onMarkerClick]);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedPost(null);
  }, []);

  if (!isLoaded) {
    return (
      <div className={`w-full h-[80vh] flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-gray-600 mb-2">Loading map...</div>
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`w-full h-[80vh] flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-6">
          <div className="text-red-600 mb-2">⚠️ Google Maps API Key Required</div>
          <div className="text-gray-600 text-sm">
            Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        }}
      >
        {posts.map((post) => (
          <Marker
            key={post.id}
            position={{ lat: post.latitude, lng: post.longitude }}
            title={post.title || `Post ${post.id}`}
            onClick={() => handleMarkerClick(post)}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new window.google.maps.Size(32, 32)
            }}
          />
        ))}
        
        {selectedPost && (
          <InfoWindow
            position={{ lat: selectedPost.latitude, lng: selectedPost.longitude }}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-semibold text-lg mb-1">
                {selectedPost.title || 'Untitled Post'}
              </h3>
              {selectedPost.date && (
                <p className="text-sm text-gray-600 mb-2">{selectedPost.date}</p>
              )}
              {selectedPost.description && (
                <p className="text-sm mb-2">{selectedPost.description}</p>
              )}
              {selectedPost.imageUrl && (
                <Image 
                  src={selectedPost.imageUrl} 
                  alt={selectedPost.title || 'Post image'}
                  width={200}
                  height={128}
                  className="w-full h-32 object-cover rounded"
                />
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
