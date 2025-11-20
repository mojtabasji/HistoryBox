import type { Metadata } from "next";
import "./globals.css";
import { SuperTokensAuthProvider } from "@/contexts/SuperTokensAuthContext";

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
          {/* Global UI overlays (moved to homepage) */}
          {children}
        </SuperTokensAuthProvider>
      </body>
    </html>
  );
}
