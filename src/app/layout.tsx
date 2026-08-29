import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP_NAME = "FinPulse";

export const metadata: Metadata = {
  title: {
    default: "FinPulse — Smart Personal Finance & Wealth Tracking",
    template: "%s | FinPulse",
  },
  description:
    "An intelligent AI-powered personal finance manager. Track income, expenses, bank statements, and Gmail transactions with automatic insights.",
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0075DE",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
