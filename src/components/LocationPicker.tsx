'use client';

import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  initialLocation?: { lat: number; lng: number };
  className?: string;
}

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

export default function LocationPicker({ 
  onLocationSelect, 
  initialLocation = defaultCenter,
  className = ''
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation
  );

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const location = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      setSelectedLocation(location);
      
      // Optional: Reverse geocoding to get address
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            onLocationSelect({
              ...location,
              address: results[0].formatted_address
            });
          } else {
            onLocationSelect(location);
          }
        });
      } else {
        onLocationSelect(location);
      }
    }
  }, [onLocationSelect]);

  const onLoad = useCallback(() => {
    // Map loaded successfully
  }, []);

  const onUnmount = useCallback(() => {
    // Map unmounted
  }, []);

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={containerStyle}>
        <div className="text-center">
          <div className="text-gray-600 mb-2">Loading map...</div>
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={containerStyle}>
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
      <div className="mb-2">
        <p className="text-sm text-gray-600">
          Click on the map to select a location for your memory
        </p>
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={selectedLocation || initialLocation}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: false,
        }}
      >
        {selectedLocation && (
          <Marker
            position={selectedLocation}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new window.google.maps.Size(32, 32)
            }}
          />
        )}
      </GoogleMap>
      {selectedLocation && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
          Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
