'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/SuperTokensAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import ImageUpload from '../../components/ImageUpload';
import LocationPicker from '../../components/LocationPicker';

export default function AddMemory() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    imageUrl: '',
    latitude: 0,
    longitude: 0,
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }));
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
      address: location.address || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.title || (formData.latitude === 0 && formData.longitude === 0)) {
      alert('Please fill in all required fields and ensure location is selected.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload image now if deferred
      let imageUrl = formData.imageUrl;
      if (!imageUrl) {
        if (!selectedFile) {
          alert('Please choose a photo to upload.');
          setIsSubmitting(false);
          return;
        }
        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(selectedFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: base64 }),
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error || 'Upload failed');
        imageUrl = uploadJson.url as string;
      }

      // Send memory data to API; session is carried via cookies
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          imageUrl,
          latitude: formData.latitude,
          longitude: formData.longitude,
          address: formData.address,
          date: formData.date
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Memory saved successfully!');
        // Reset form
        setFormData({
          title: '',
          description: '',
          date: '',
          imageUrl: '',
          latitude: 0,
          longitude: 0,
          address: ''
        });
        setSelectedFile(null);
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        console.error('Error saving memory:', result.error);
        alert(`Failed to save memory: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save memory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isSubmitting && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="flex items-center space-x-3 rounded-lg bg-white px-4 py-3 shadow-lg">
            <svg className="h-5 w-5 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-sm font-medium text-gray-900">Saving memory…</span>
          </div>
        </div>,
        document.body
      )}
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
                <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Map View
                </Link>
                <a href="/add-memory" className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-md text-sm font-medium">
                  Add Memory
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.phoneNumber ? `Welcome, ${user.phoneNumber}` : 'Welcome'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Add New Memory</h2>
            <p className="text-gray-600">
              Capture a special moment with photos and location details.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Prevent unintended submits when selecting files
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Memory Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Give your memory a title"
                  />
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Describe this memory..."
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Photo</h3>
              <ImageUpload
                onImageUpload={handleImageUpload}
                currentImage={formData.imageUrl}
                uploadOnSelect={false}
                onFileSelected={(file) => setSelectedFile(file)}
                className="w-full"
              />
            </div>

            {/* Location Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                className="w-full"
              />
              {formData.address && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Selected Location:</strong> {formData.address}
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {isSubmitting ? 'Saving...' : 'Save Memory'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
