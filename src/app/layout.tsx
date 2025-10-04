import type { Metadata } from "next";
import "./globals.css";
import { SuperTokensAuthProvider } from "@/contexts/SuperTokensAuthContext";
import CoinsBadge from "@/components/CoinsBadge";

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
    <html lang="en">
      <body className="antialiased">
        <SuperTokensAuthProvider>
          {/* Global UI overlays */}
          <div className="fixed right-3 top-3 z-[10000]"><CoinsBadge /></div>
          {children}
        </SuperTokensAuthProvider>
      </body>
    </html>
  );
}
