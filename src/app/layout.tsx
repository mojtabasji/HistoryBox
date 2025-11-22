import type { Metadata } from "next";
import "./globals.css";
import { SuperTokensAuthProvider } from "@/contexts/SuperTokensAuthContext";
import { Vazirmatn } from "next/font/google";

// Persian font (Vazirmatn) for improved legibility of Farsi text
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
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
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="antialiased font-fa">
        <SuperTokensAuthProvider>
          {/* Global UI overlays (moved to homepage) */}
          {children}
        </SuperTokensAuthProvider>
      </body>
    </html>
  );
}
