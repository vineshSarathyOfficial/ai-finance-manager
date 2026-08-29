import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling these native/CJS-only modules through Webpack/Turbopack.
  // They are used in Node.js API routes and work fine as external packages.
  serverExternalPackages: ["pdf-parse", "pdfkit"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
