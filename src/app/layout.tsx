import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HistoryBox - Discover Hidden Stories",
  description: "Explore the world through geolocated historical photos and stories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
