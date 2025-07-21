import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server actions by default
  experimental: {
    serverActions: {
      // Allow all server actions (default is already true, but being explicit)
      allowedOrigins: ['*'],
    },
  },
  // Configure image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Reduce API routes in favor of server actions
  redirects: async () => [
    {
      source: '/api/:path*',
      has: [
        {
          type: 'header',
          key: 'x-use-server-action',
          value: 'true',
        },
      ],
      destination: '/api-not-found',
      permanent: false,
    },
  ],
};

export default nextConfig;
