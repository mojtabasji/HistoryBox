'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ImageUpload from '@/components/ImageUpload';
import LocationPicker from '@/components/LocationPicker';
import { createPortal } from 'react-dom';

type Memory = {
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

export default function EditMemoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => Number(params?.id), [params]);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string }>({ lat: 0, lng: 0, address: '' });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;
    (async () => {
      const res = await fetch(`/api/memories/${id}`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to load memory');
        router.push('/dashboard');
        return;
      }
  const m = data.memory as Memory;
      setTitle(m.title || '');
      setDescription(m.description || m.caption || '');
      setImageUrl(m.imageUrl || '');
      setDate(m.memoryDate ? m.memoryDate.substring(0, 10) : '');
      setLocation({ lat: m.latitude, lng: m.longitude, address: m.address || '' });
      setIsLoading(false);
    })();
  }, [id, router]);

  if (loading || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || Number.isNaN(id)) return;
    setIsSaving(true);
    try {
      let url = imageUrl;
      if (!url && selectedFile) {
        // upload new file if chosen
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
        url = uploadJson.url as string;
      }

      const res = await fetch(`/api/memories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          imageUrl: url,
          latitude: location.lat,
          longitude: location.lng,
          address: location.address,
          date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      alert('Memory updated');
      router.push('/dashboard');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/20">
          <div className="flex items-center space-x-3 rounded-lg bg-white px-4 py-3 shadow-lg">
            <svg className="h-5 w-5 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-sm font-medium text-gray-900">Loading memory…</span>
          </div>
        </div>, document.body)}
      {isSaving && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="flex items-center space-x-3 rounded-lg bg-white px-4 py-3 shadow-lg">
            <svg className="h-5 w-5 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-sm font-medium text-gray-900">Saving…</span>
          </div>
        </div>, document.body)}

      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">Edit Memory</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={title} onChange={e=>setTitle(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={date} onChange={e=>setDate(e.target.value)} />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={description} onChange={e=>setDescription(e.target.value)} />
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Photo</h3>
              <ImageUpload
                onImageUpload={(url)=> setImageUrl(url)}
                currentImage={imageUrl}
                uploadOnSelect={false}
                onFileSelected={file => setSelectedFile(file)}
                className="w-full"
              />
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
              <LocationPicker onLocationSelect={setLocation} initialLocation={{ lat: location.lat, lng: location.lng }} className="w-full" />
              {location.address && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                  <strong>Selected Location:</strong> {location.address}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => router.push('/dashboard')} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={isSaving} className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${isSaving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{isSaving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
