import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['apify-client', 'proxy-agent'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
