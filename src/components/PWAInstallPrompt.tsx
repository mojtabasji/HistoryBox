"use client";
import React, { useEffect, useState } from 'react';

// Extend Navigator type to include optional iOS standalone property
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

// Handles showing an install prompt for Android/Chromium and guidance for iOS Safari.
// Usage: place <PWAInstallPrompt/> high in the layout (e.g., RootLayout body).

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosGuide, setIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // iOS detection + standalone check
    const isIOS = /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
    const isStandalone = navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !isStandalone) {
      setIosGuide(true);
    }
    const handler = (e: Event) => {
      const ev = e as BeforeInstallPromptEvent;
      ev.preventDefault();
      setDeferred(ev);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (dismissed || (!visible && !iosGuide)) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-xs w-[90vw] bg-white shadow-lg rounded-lg border border-gray-200 p-4 text-sm rtl-num">
      {iosGuide ? (
        <div>
          <div className="font-semibold mb-1">نصب به عنوان اپلیکیشن</div>
          <p className="text-gray-700 mb-2 leading-relaxed">
            برای افزودن History Box به صفحه اصلی در iOS:
            <br/>۱. دکمه <span className="inline-block px-1 py-0.5 bg-gray-100 rounded border">Share</span> را لمس کنید.
            <br/>۲. گزینه <strong>Add to Home Screen</strong> را انتخاب کنید.
            <br/>۳. روی <strong>Add</strong> بزنید.
          </p>
          <button onClick={() => { setIosGuide(false); setDismissed(true); }} className="hb-btn-primary w-full h-9 rounded-md text-sm">متوجه شدم</button>
        </div>
      ) : deferred ? (
        <div>
          <div className="font-semibold mb-1">نصب History Box</div>
          <p className="text-gray-700 mb-3">برای دسترسی سریع، می‌توانید این وب‌اپ را نصب کنید.</p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  await deferred.prompt();
                  const choice = await deferred.userChoice;
                  if (choice.outcome === 'accepted') {
                    setVisible(false);
                  } else {
                    setDismissed(true);
                  }
                } catch {
                  setDismissed(true);
                }
              }}
              className="hb-btn-primary flex-1 h-9 rounded-md text-sm"
            >نصب</button>
            <button
              onClick={() => { setDismissed(true); setVisible(false); }}
              className="px-3 h-9 rounded-md text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >بعدا</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
