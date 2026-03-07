import type { NextConfig } from "next";

// Backend URL for API rewrites (use env in production, e.g. http://127.0.0.1:5000 on EC2)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
