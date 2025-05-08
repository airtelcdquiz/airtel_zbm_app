import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ['bullmq'],
  }
};

export default nextConfig;
