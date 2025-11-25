'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/SuperTokensAuthContext';
import HeaderCoinCount from '@/components/HeaderCoinCount';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { t } from '@/lib/i18n';
import ImageUpload from '../../components/ImageUpload';
import LocationPicker from '../../components/LocationPicker';

export default function AddMemory() {
  const { user, loading, coins, setCoins } = useAuth();
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
  };

  const handleLocationSelect = (loc: { lat: number; lng: number; address?: string }) => {
    setFormData(prev => ({ ...prev, latitude: loc.lat, longitude: loc.lng, address: loc.address ?? prev.address }));
    if (!currentLocation || currentLocation.lat !== loc.lat || currentLocation.lng !== loc.lng) {
      setCurrentLocation({ lat: loc.lat, lng: loc.lng });
    }
  };

  const handleLocateMe = async () => {
    if (!('geolocation' in navigator)) {
      alert('مرورگر شما از موقعیت‌یاب پشتیبانی نمی‌کند');
      return;
    }
    try {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        alert('برای استفاده از موقعیت‌یاب، وب‌سایت باید با HTTPS باز شود یا روی localhost اجرا شود.');
        return;
      }
      const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
      type GeoPermissionStatus = { state?: 'granted' | 'denied' | 'prompt' };
      type PermissionsLike = { query: (arg: { name: 'geolocation' }) => Promise<GeoPermissionStatus> };
      const perms = (navigator as unknown as { permissions?: PermissionsLike }).permissions;
      if (perms?.query) {
        try {
          const status = await perms.query({ name: 'geolocation' });
          if (status?.state === 'denied') {
            alert(isIOS
              ? 'دسترسی موقعیت در iOS مسدود است. به Settings > Privacy > Location Services > Safari Websites بروید و While Using/Ask را انتخاب کنید یا در Safari روی aA > Website Settings > Location اجازه دهید، سپس صفحه را بازآوری کنید.'
              : 'دسترسی موقعیت مسدود است. در تنظیمات مرورگر، دسترسی Location را برای این وب‌سایت فعال کنید و دوباره تلاش کنید.');
            return;
          }
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      let address: string | undefined;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, { headers: { 'User-Agent': 'history_box/1.0' } });
        if (res.ok) {
          const data = await res.json();
          address = data.display_name;
        }
      } catch {/* ignore */}
      setCurrentLocation({ lat: latitude, lng: longitude });
      setFormData(prev => ({ ...prev, latitude, longitude, address: address ?? prev.address }));
      setLocating(false);
    }, (err) => {
      console.error(err);
      const code = (err && (err as GeolocationPositionError).code) || 0;
      if (code === 1) {
        alert('دسترسی مکان رد شد. لطفاً در تنظیمات مرورگر اجازه دسترسی Location را به این سایت بدهید. در iOS: Settings > Privacy > Location Services > Safari Websites یا aA > Website Settings > Location.');
      } else if (code === 2) {
        alert('امکان دریافت موقعیت وجود ندارد. لطفاً اتصال GPS/اینترنت را بررسی کرده و دوباره تلاش کنید.');
      } else if (code === 3) {
        alert('زمان دریافت موقعیت تمام شد. لطفاً دوباره تلاش کنید.');
      } else {
        alert('دریافت موقعیت ناموفق بود');
      }
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (typeof coins === 'number' && coins <= 5) {
        alert('سکه کافی برای افزودن خاطره ندارید. لطفاً ابتدا سکه بخرید.');
        setIsSubmitting(false);
        return;
      }
      let imageUrl = formData.imageUrl;
      if (!imageUrl) {
        if (!selectedFile) {
          alert('Please choose a photo to upload.');
          setIsSubmitting(false);
          return;
        }
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

      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          imageUrl,
          latitude: formData.latitude,
          longitude: formData.longitude,
          address: formData.address,
          date: formData.date,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to save memory');
      }
      alert('Memory saved successfully!');
      if (typeof result?.coins === 'number') {
        setCoins(result.coins);
      }
      setFormData({ title: '', description: '', date: '', imageUrl: '', latitude: 0, longitude: 0, address: '' });
      setSelectedFile(null);
      router.push('/dashboard');
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
            <span className="text-sm font-medium text-gray-900 rtl-num">Saving memory…</span>
          </div>
        </div>,
        document.body
      )}
      {/* Header */}
      <header className="bg-white shadow relative z-[1000]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Desktop */}
          <div className="hidden md:flex items-center justify-between">
            <h1 className="text-xl font-semibold hb-brand font-fa">{t('brand')}</h1>
            <div className="flex items-center gap-3">
              <Link href="/" className="hb-btn-primary px-4 py-2 text-sm">{t('viewMap')}</Link>
              <Link href="/dashboard" className="hb-btn-primary px-4 py-2 text-sm">{t('dashboard')}</Link>
              {typeof coins === 'number' && <HeaderCoinCount value={coins} />}
            </div>
          </div>
          {/* Mobile */}
          <div className="md:hidden flex items-center justify-between h-12 gap-2">
            <h1 className="text-lg font-semibold hb-brand font-fa">{t('brand')}</h1>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="h-10 w-10 rounded-md shadow-md flex items-center justify-center hb-btn-primary text-sm"
                aria-label={t('viewMap')}
                title={t('viewMap')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              {typeof coins === 'number' && <HeaderCoinCount value={coins} small />}
              <button
                onClick={() => setMobileMenuOpen(s => !s)}
                className={`h-10 w-10 rounded-md shadow-md flex items-center justify-center ${mobileMenuOpen ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800'}`}
                aria-label="Toggle menu"
                aria-pressed={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round"/></svg>
                )}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 bg-white rounded-lg shadow p-3 flex flex-col gap-2">
              <Link href="/" className="hb-btn-primary h-10 inline-flex items-center justify-center rounded-md">{t('viewMap')}</Link>
              <Link href="/dashboard" className="hb-btn-primary h-10 inline-flex items-center justify-center rounded-md">{t('dashboard')}</Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">افزودن خاطره جدید</h2>
            <p className="text-gray-700">
              یک لحظه خاص را با عکس و جزئیات مکان ثبت کنید.
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">جزئیات خاطره</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="یک عنوان برای خاطره وارد کنید"
                  />
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    تاریخ
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
                <label htmlFor="description" className="block text-sm font-medium text-gray-800 mb-2">
                  توضیحات
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="این خاطره را توضیح دهید..."
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">عکس</h3>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">مکان</h3>
              <div className="mb-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={locating}
                  className={`hb-btn-primary px-4 py-2 text-sm rounded-md inline-flex items-center gap-2 ${locating ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {locating && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M4 12a8 8 0 018-8" strokeOpacity="0.75" />
                    </svg>
                  )}
                  <span>مکان فعلی من</span>
                </button>
                {formData.address && (
                  <span className="px-3 py-2 bg-gray-100 rounded text-xs text-gray-700 max-w-full truncate" title={formData.address}>{formData.address}</span>
                )}
              </div>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={currentLocation ?? undefined}
                className="w-full"
              />
              {formData.address && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>مکان انتخاب‌شده:</strong> {formData.address}
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
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {isSubmitting ? 'در حال ذخیره...' : 'ذخیره خاطره'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
