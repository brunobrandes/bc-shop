import type { NextConfig } from "next";

const isFirebaseGenericBuild = process.env.BC_FIREBASE_GENERIC_BUILD === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isFirebaseGenericBuild ? undefined : "standalone",
  // Keep standalone output rooted at this app when it is built independently.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
