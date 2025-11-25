'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { t } from '@/lib/i18n';
import { useAuth } from '@/contexts/SuperTokensAuthContext';
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
        alert(data.error || t('loadingMemory'));
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
        // Compress & upload new file if chosen (match add-memory behavior)
        const compressIfNeeded = async (file: File): Promise<File> => {
          const MAX_DIRECT_BYTES = 4 * 1024 * 1024; // 4MB threshold before compression
          if (file.size <= MAX_DIRECT_BYTES) return file;
          const bitmap = await createImageBitmap(file);
          const MAX_W = 1600;
          const MAX_H = 1600;
          let { width, height } = bitmap;
          const scale = Math.min(1, MAX_W / width, MAX_H / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return file;
          ctx.drawImage(bitmap, 0, 0, width, height);
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(b => resolve(b), 'image/jpeg', 0.82);
          });
          if (!blob) return file;
          if (blob.size >= file.size) return file;
          return new File([blob], file.name.replace(/\.[a-zA-Z]+$/, '.jpg'), { type: 'image/jpeg' });
        };
        const processedFile = await compressIfNeeded(selectedFile);
        const fd = new FormData();
        fd.append('file', processedFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (uploadRes.status === 413) {
          throw new Error('حجم تصویر خیلی بزرگ است. لطفاً عکس کوچکتری (زیر 8MB) انتخاب کنید.');
        }
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
      alert(t('memoryUpdated'));
      router.push('/dashboard');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  // Jalali (Shamsi) date conversion (same logic as add-memory)
  const toJalali = (isoDate: string) => {
    if (!isoDate) return null;
    const [gyStr, gmStr, gdStr] = isoDate.split('-');
    const gy = parseInt(gyStr, 10); const gm = parseInt(gmStr, 10); const gd = parseInt(gdStr, 10);
    if (isNaN(gy) || isNaN(gm) || isNaN(gd)) return null;
    const g_d_m = [0,31, (gy%4===0 && gy%100!==0) || (gy%400===0) ? 29:28,31,30,31,30,31,31,30,31,30,31];
    const gy2 = gy-1600 + 1; const gm2 = gm-1; const gd2 = gd-1;
    let g_day_no = 365*gy2 + Math.floor((gy2+3)/4) - Math.floor((gy2+99)/100) + Math.floor((gy2+399)/400);
    for (let i=0;i<gm2;++i) g_day_no += g_d_m[i+1]; g_day_no += gd2;
    let j_day_no = g_day_no - 79; const j_np = Math.floor(j_day_no / 12053); j_day_no = j_day_no % 12053;
    let jy = 979 + 33*j_np + 4*Math.floor(j_day_no/1461); j_day_no %= 1461;
    if (j_day_no >= 366) { jy += Math.floor((j_day_no-366)/365); j_day_no = (j_day_no-366)%365; }
    const jmDays = [31,31,31,31,31,31,30,30,30,30,30,29]; let jm = 0;
    for (; jm < 11 && j_day_no >= jmDays[jm]; ++jm) j_day_no -= jmDays[jm];
    const jd = j_day_no + 1; const monthsFa = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
    const monthName = monthsFa[jm]; return { jy, jm: jm+1, jd, formatted: `${jd} ${monthName} ${jy}` };
  };
  const jalali = toJalali(date);

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/20">
          <div className="flex items-center space-x-3 rounded-lg bg-white px-4 py-3 shadow-lg">
            <svg className="h-5 w-5 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-sm font-medium text-gray-900">{t('loadingMemory')}</span>
          </div>
        </div>, document.body)}
      {isSaving && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="flex items-center space-x-3 rounded-lg bg-white px-4 py-3 shadow-lg">
            <svg className="h-5 w-5 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-sm font-medium text-gray-900">{t('saving')}</span>
          </div>
        </div>, document.body)}

      <nav className="bg-white shadow relative z-[1000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop header */}
          <div className="hidden md:flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold hb-brand font-fa">{t('editMemory')}</h1>
            <div className="flex items-center gap-3">
              <Link href="/" className="hb-btn-primary px-4 py-2 text-sm">{t('viewMap')}</Link>
              <Link href="/dashboard" className="hb-btn-primary px-4 py-2 text-sm">{t('dashboard')}</Link>
            </div>
          </div>
          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between h-14 gap-2">
            <h1 className="text-lg font-semibold hb-brand font-fa">{t('editMemory')}</h1>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="h-10 w-10 rounded-md shadow-md flex items-center justify-center hb-btn-primary text-sm"
                aria-label={t('viewMap')}
                title={t('viewMap')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              {/* Merged buttons component (minimal for edit page) */}
              <Link
                href="/dashboard"
                className="h-10 w-10 rounded-md shadow-md flex items-center justify-center bg-white text-gray-800 hover:bg-gray-100"
                aria-label={t('dashboard')}
                title={t('dashboard')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/></svg>
              </Link>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('titleLabel')} *</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500" placeholder={t('titleLabel')} value={title} onChange={e=>setTitle(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('dateLabel')}</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" value={date} onChange={e=>setDate(e.target.value)} />
                  {jalali && (
                    <p className="mt-1 text-xs text-gray-600 rtl-num" dir="rtl">تاریخ شمسی: <span className="font-medium">{jalali.formatted}</span></p>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-800 mb-2">{t('descriptionLabel')}</label>
                <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" value={description} onChange={e=>setDescription(e.target.value)} />
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 font-fa">{t('photo')}</h3>
              <ImageUpload
                onImageUpload={(url)=> setImageUrl(url)}
                currentImage={imageUrl}
                uploadOnSelect={false}
                onFileSelected={file => setSelectedFile(file)}
                className="w-full"
              />
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 font-fa">{t('location')}</h3>
              <LocationPicker onLocationSelect={setLocation} initialLocation={{ lat: location.lat, lng: location.lng }} className="w-full" />
              {location.address && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-600 rtl-num">
                  <strong>{t('selectedLocation')}:</strong> {location.address}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 bg-white shadow-sm">{t('cancel')}</button>
              <button type="submit" disabled={isSaving} className={`px-4 py-2 rounded-md text-sm font-medium text-white shadow ${isSaving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{isSaving ? t('saving') : t('saveChanges')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
