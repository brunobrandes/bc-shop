import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Firebase App Hosting builds this app from apps/web and expects the
  // standalone manifest directly under .next/standalone/.next.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
