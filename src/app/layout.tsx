import type { Metadata } from "next";
import "./globals.css";
import { SuperTokensAuthProvider } from "@/contexts/SuperTokensAuthContext";
import { Rubik } from "next/font/google";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={rubik.variable}>
      <body className="antialiased font-fa bg-[var(--hb-bg)] text-[var(--hb-text-dark)]">
        <SuperTokensAuthProvider>
          {/* Global UI overlays (moved to homepage) */}
          {children}
        </SuperTokensAuthProvider>
      </body>
    </html>
  );
}
