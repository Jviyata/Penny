import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpendQ · with Penny",
  description: "See what a purchase means for the rest of your month before you buy it.",
  applicationName: "SpendQ",
  appleWebApp: {
    capable: true,
    title: "SpendQ",
    // Content runs under the status bar; safe-area insets keep it clear of the Dynamic Island.
    statusBarStyle: "default", // dark status-bar text on the white app
  },
  formatDetection: { telephone: false },
  other: {
    // Older iOS versions still look for the apple- prefixed tag.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#f8f6f1" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
