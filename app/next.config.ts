import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Renommé depuis `experimental.serverComponentsExternalPackages` (Next 15).
  serverExternalPackages: ['bullmq'],
};

export default nextConfig;
