'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  currentImage?: string;
  className?: string;
}

export default function ImageUpload({ onImageUpload, currentImage, className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Track where preview came from: 'prop' (parent URL), 'remote' (uploaded URL), 'local' (object URL)
  const [previewSource, setPreviewSource] = useState<'prop' | 'remote' | 'local' | null>(currentImage ? 'prop' : null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore temporary preview if component remounts during the same session
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? sessionStorage.getItem('hb_local_preview_url') : null;
      if (saved && !currentImage) {
        setPreview(saved);
        setPreviewSource('local');
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep preview in sync if parent passes a new URL
  useEffect(() => {
    // If parent provides a new image URL, adopt it as the preview
    if (currentImage) {
      setPreview(currentImage);
      setPreviewSource('prop');
      setUploadError(null);
      return;
    }
    // If parent cleared the image, only clear preview if it's not a local selection
    if (!currentImage && previewSource !== 'local') {
      setPreview(null);
      setPreviewSource(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImage]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    setLastFile(file);
    setUploadError(null);
    // Create immediate local preview
    const previewUrl = URL.createObjectURL(file);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(previewUrl);
    setPreview(previewUrl);
    setPreviewSource('local');
    // Save blob url (small string) to survive Fast Refresh remounts during dev
    try { if (typeof window !== 'undefined') sessionStorage.setItem('hb_local_preview_url', previewUrl); } catch {}

    // Generate base64 immediately so if the component remounts, we can restore from sessionStorage
    void convertToBase64(file)
      .then((b64) => {
        // Kick off upload as soon as we have base64, reuse it to avoid double work
        void uploadImage(file, b64);
      })
      .catch(() => {
        // Even if base64 generation fails (rare), still attempt upload which will try again
        void uploadImage(file);
      });
  };

  const uploadImage = async (file: File, base64FromSelect?: string) => {
    setUploading(true);
    
    try {
      // Get base64 (use cached one from selection if available)
      const base64 = base64FromSelect ?? await convertToBase64(file);
  // We've already stored a blob URL for preview; no need to store large base64 in sessionStorage
      
      // Upload to Cloudinary
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: base64 }),
      });

      if (!response.ok) {
        let message = 'Upload failed';
        try {
          const error = await response.json();
          message = error?.error || message;
        } catch {
          try { message = await response.text(); } catch {}
        }
        throw new Error(message);
      }

      const { url } = await response.json();
      onImageUpload(url);
      setPreview(url);
      setPreviewSource('remote');
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
      }
      setUploadError(null);
  // Clear temporary blob preview from session (we have a stable remote URL now)
  try { if (typeof window !== 'undefined') sessionStorage.removeItem('hb_local_preview_url'); } catch {}
      
    } catch (error) {
      console.error('Upload error:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setUploadError(msg);
      // Keep local preview so user can retry, do not clear
    } finally {
      setUploading(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
      // Reset input value so selecting the same file again triggers onChange
      // Some browsers won't fire change if the value didn't change
      try { e.target.value = ''; } catch {}
    }
  };

  // overlay input handles clicks; no separate click handler needed

  return (
    <div className={className}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'pointer-events-none opacity-75' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Invisible file input overlay to ensure native click works reliably */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          onClick={(e) => {
            // Allow reselecting the same file
            // Reset before the click opens the picker to ensure change fires
            const input = e.currentTarget as HTMLInputElement;
            try { input.value = ''; } catch {}
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Upload image"
        />

        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="mx-auto rounded-lg max-h-64 w-full h-auto object-contain bg-gray-50"
            />
          </div>
        ) : (
          <div className="py-8 pointer-events-none">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        )}

        {(uploading || uploadError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            {!uploadError ? (
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center max-w-xs text-center">
                <div className="text-sm text-red-600 font-medium">Upload failed</div>
                <div className="text-xs text-gray-600 mt-1">{uploadError}</div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); if (lastFile) uploadImage(lastFile); }}
                    className="px-3 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700"
                    disabled={!lastFile}
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setUploadError(null); }}
                    className="px-3 py-1 text-xs rounded bg-white border hover:bg-gray-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {preview && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
              setObjectUrl(null);
            }
            onImageUpload('');
          }}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Remove image
        </button>
      )}
      {/* Clear temporary preview if user removes image */}
      {preview === null && (
        <span className="sr-only" aria-hidden="true">
          {(() => { try { if (typeof window !== 'undefined') sessionStorage.removeItem('hb_local_preview_url'); } catch {} return null; })()}
        </span>
      )}
    </div>
  );
}
