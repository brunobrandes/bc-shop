import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Firebase builds this package as an independent application root.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
