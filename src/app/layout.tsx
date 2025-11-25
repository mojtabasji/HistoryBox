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
  title: "History Box",
  description: "Your personal history tracking application",
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
