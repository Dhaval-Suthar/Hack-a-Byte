import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable styled-jsx for CSS-in-JS support
  compiler: {
    styledComponents: true,
  },
  // Enable server actions by default
  experimental: {
    serverActions: {
      // Allow all server actions (default is already true, but being explicit)
      allowedOrigins: ['*'],
    },
  },
  // Configure image domains and optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Ensure static images work properly on Vercel
    unoptimized: false, // Keep optimization enabled for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Static file configuration
  assetPrefix: '',
  trailingSlash: false,
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
