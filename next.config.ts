import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling these native/CJS-only modules through Webpack/Turbopack.
  // They are used in Node.js API routes and work fine as external packages.
  serverExternalPackages: ["pdf-parse", "pdfkit"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default withSerwist(nextConfig);
