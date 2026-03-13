import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a standalone build for optimized Docker images
  // This creates a .next/standalone directory with only necessary files
  output: 'standalone',

  // Enable React strict mode for development error catching
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  // Configure image optimization for better performance
  images: {
    unoptimized: true,
    remotePatterns: [],
  },
};

export default nextConfig;
