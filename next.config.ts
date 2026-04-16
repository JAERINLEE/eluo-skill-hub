import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: 'https://eluo-xcipe.vercel.app/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
