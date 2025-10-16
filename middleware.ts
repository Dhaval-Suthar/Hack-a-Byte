import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 1000000; // Max requests per window

function checkRateLimit(request: NextRequest): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';
  const now = Date.now();
  const windowKey = `${ip}:${Math.floor(now / RATE_LIMIT_WINDOW)}`;

  const current = rateLimitStore.get(windowKey) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  if (now > current.resetTime) {
    // Reset window
    rateLimitStore.set(windowKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else if (current.count >= RATE_LIMIT_MAX) {
    // Rate limit exceeded
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests from this IP, please try again later.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
        },
      }
    );
  } else {
    // Increment counter
    rateLimitStore.set(windowKey, { ...current, count: current.count + 1 });
  }

  return null;
}

export function middleware(request: NextRequest) {
  // Skip rate limiting for static files and health checks
  if (
    !request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/api/health')
  ) {
    // Apply basic security headers for non-API routes
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // Apply rate limiting for API routes
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Security headers
  const response = NextResponse.next();

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Add comprehensive security headers
  addSecurityHeaders(response);

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200 });
  }

  return response;
}

function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=self, microphone=(), geolocation=()');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
      // Allow Vercel Live Preview scripts in preview deployments
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live https://sdk.cashfree.com; " +
      // IMPORTANT: Allow WebSocket schemes for Socket.IO (self) and keep required HTTPS endpoints
      "connect-src 'self' ws: wss: https://va.vercel-scripts.com https://vercel.live https://api.cashfree.com https://sandbox.cashfree.com https://nominatim.openstreetmap.org https://server.arcgisonline.com; " +
      "img-src 'self' data: https: https://api.iconify.design https://cdnjs.cloudflare.com https://tile.openstreetmap.org https://server.arcgisonline.com; " +
      "style-src 'self' 'unsafe-inline'; font-src 'self' data:; " +
      "frame-src https://payments.cashfree.com https://payments-test.cashfree.com;"
  );
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
