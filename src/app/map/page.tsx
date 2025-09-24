'use client';

import React, { useState } from 'react';
import Map, { Post } from '../../components/Map';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Sample posts for demonstration
const samplePosts: Post[] = [
  {
    id: '1',
    latitude: 40.7128,
    longitude: -74.0060,
    title: 'New York City',
    description: 'Had an amazing time in the Big Apple!',
    date: '2024-01-15',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop'
  },
  {
    id: '2',
    latitude: 34.0522,
    longitude: -118.2437,
    title: 'Los Angeles',
    description: 'Beautiful sunset at Santa Monica Beach',
    date: '2024-02-20',
    imageUrl: 'https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=400&h=300&fit=crop'
  },
  {
    id: '3',
    latitude: 51.5074,
    longitude: -0.1278,
    title: 'London',
    description: 'Visited Big Ben and the Tower Bridge',
    date: '2024-03-10',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop'
  },
  {
    id: '4',
    latitude: 48.8566,
    longitude: 2.3522,
    title: 'Paris',
    description: 'The Eiffel Tower was breathtaking!',
    date: '2024-03-25',
    imageUrl: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop'
  },
  {
    id: '5',
    latitude: 35.6762,
    longitude: 139.6503,
    title: 'Tokyo',
    description: 'Cherry blossoms in full bloom',
    date: '2024-04-05',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop'
  }
];

export default function MapView() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleMarkerClick = (post: Post) => {
    setSelectedPost(post);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">History Box</h1>
              <div className="hidden md:flex space-x-4">
                <a href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <a href="/map" className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-md text-sm font-medium">
                  Map View
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.email}</span>
              <button
                onClick={() => {
                  // Add logout functionality
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your History Map</h2>
            <p className="text-gray-600">
              Explore your memories around the world. Click on markers to see details.
            </p>
          </div>

          {/* Map Container */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {samplePosts.length} locations visited
              </h3>
            </div>
            <Map 
              posts={samplePosts}
              onMarkerClick={handleMarkerClick}
              zoom={2}
            />
          </div>

          {/* Selected Post Details */}
          {selectedPost && (
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-2">{selectedPost.title}</h3>
              <p className="text-gray-600 mb-2">{selectedPost.date}</p>
              <p className="text-gray-800 mb-4">{selectedPost.description}</p>
              <div className="text-sm text-gray-500">
                Coordinates: {selectedPost.latitude.toFixed(4)}, {selectedPost.longitude.toFixed(4)}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-blue-800 font-medium mb-2">🗺️ About the Map</h4>
            <div className="text-blue-700 text-sm space-y-1">
              <p>• This map uses Leaflet with OpenStreetMap tiles. No API key required.</p>
              <p>• Click a marker to see details of that memory.</p>
              <p>• Coming soon: show your real uploaded memories on the map.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
