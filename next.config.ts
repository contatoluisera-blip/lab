import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Mantido por enquanto; religar quando a tipagem das telas antigas for revisada.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
