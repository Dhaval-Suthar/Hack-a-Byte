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
  // Configure webpack to handle Node.js modules properly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack: (config: any, { isServer }: any) => {
    // Only run on client-side builds
    if (!isServer) {
      // Exclude server-side modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        util: false,
        http: false,
        https: false,
        zlib: false,
        querystring: false,
        url: false,
      };

      // Exclude instrumentation.ts and related server files from client bundle
      config.externals = config.externals || [];
      config.externals.push((context: { context?: string }, request: string, callback: (error?: Error | null, result?: string | boolean) => void) => {
        if (request.includes('instrumentation') ||
            request.includes('stateSweeper') ||
            request.includes('randomMessageGenerator') ||
            request.includes('socket') ||
            request.includes('redis')) {
          return callback(null, '{}');
        }
        callback();
      });
    }

    return config;
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
  // Include ws/wss in connect-src to allow WebSocket connections in dev and prod
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://checkout.razorpay.com; connect-src 'self' ws: wss: https://va.vercel-scripts.com https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com https://nominatim.openstreetmap.org https://server.arcgisonline.com; img-src 'self' data: https: https://api.iconify.design https://cdnjs.cloudflare.com https://tile.openstreetmap.org https://server.arcgisonline.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src https://checkout.razorpay.com https://api.razorpay.com;",
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
