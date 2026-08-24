import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Finance Manager — Track, Analyze, Grow",
    template: "%s | Finance Manager",
  },
  description:
    "A personal AI-powered finance manager to track income, expenses, and get smart insights on your spending.",
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
