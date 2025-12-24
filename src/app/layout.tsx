import type { Metadata } from "next";
import "./globals.css";
import { SuperTokensAuthProvider } from "@/contexts/SuperTokensAuthContext";
import { Rubik } from "next/font/google";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import React from "react";

// Replace previous Vazirmatn with Google Rubik as requested.
// Note: Rubik does not include Persian (Arabic) glyphs; unsupported characters will fall back.
// If full Persian coverage is needed later consider pairing with Vazirmatn or Noto Naskh Arabic.
const rubik = Rubik({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fa",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HistoryBox - خاطرات شما روی نقشه جهان",
    template: "%s | HistoryBox"
  },
  description: "HistoryBox - پلتفرم اشتراک‌گذاری و کشف خاطرات تاریخی و فرهنگی با موقعیت جغرافیایی. عکس‌ها و داستان‌های خود را روی نقشه جهان به اشتراک بگذارید.",
  keywords: ["HistoryBox", "خاطرات", "نقشه", "عکس", "تاریخ", "فرهنگ", "مکان", "سفر", "گردشگری"],
  authors: [{ name: "HistoryBox Team" }],
  creator: "HistoryBox",
  publisher: "HistoryBox",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://historybox.app'),
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "/",
    siteName: "HistoryBox",
    title: "HistoryBox - خاطرات شما روی نقشه جهان",
    description: "پلتفرم اشتراک‌گذاری و کشف خاطرات تاریخی و فرهنگی با موقعیت جغرافیایی",
  },
  twitter: {
    card: "summary_large_image",
    title: "HistoryBox",
    description: "پلتفرم اشتراک‌گذاری خاطرات روی نقشه جهان",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Prevent pinch/gesture zoom on mobile as requested
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={rubik.variable}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="application-name" content="History Box" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="History Box" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="antialiased font-fa bg-[var(--hb-bg)] text-[var(--hb-text-dark)]">
        <SuperTokensAuthProvider>
          {/* Global UI overlays (moved to homepage) */}
          {children}
          {/* PWA install prompt for mobile */}
          <PWAInstallPrompt />
        </SuperTokensAuthProvider>
        {/* Service worker registration */}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});});}` }} />
      </body>
    </html>
  );
}
