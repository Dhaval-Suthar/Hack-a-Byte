import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // Max requests per window

// API rate limiting middleware
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  // Skip rate limiting for static files and health checks
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/api/health') ||
    request.nextUrl.pathname === '/favicon.ico'
  ) {
    return null;
  }

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

// Security headers middleware
export function securityHeadersMiddleware() {
  const headers = new Headers();

  // Content Security Policy
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return headers;
}
