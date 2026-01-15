import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // For Docker deployment (uncomment for Docker builds)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
