import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  experimental: {
    proxyClientMaxBodySize: 52428800, // 50MB
  },
};

export default nextConfig;
