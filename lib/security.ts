import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/redis';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';

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

// Enhanced rate limiting with Redis (when available)
export async function enhancedRateLimit(
  key: string,
  maxRequests: number = 100,
  windowSeconds: number = 900
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Try Redis-based rate limiting first
  try {
    return await RateLimiter.checkLimit(key, maxRequests, windowSeconds);
  } catch {
    // Fallback to in-memory rate limiting
    logger.warn('Redis rate limiting failed, using in-memory fallback');
    return inMemoryRateLimit(key, maxRequests, windowSeconds);
  }
}

function inMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `${key}:${Math.floor(now / windowSeconds)}`;

  const current = rateLimitStore.get(windowKey) || { count: 0, resetTime: now + windowSeconds };

  if (now > current.resetTime) {
    rateLimitStore.set(windowKey, { count: 1, resetTime: now + windowSeconds });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowSeconds };
  } else if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  } else {
    const newCount = current.count + 1;
    rateLimitStore.set(windowKey, { ...current, count: newCount });
    return { allowed: true, remaining: maxRequests - newCount, resetTime: current.resetTime };
  }
}

// SQL injection prevention (for raw queries if any)
export function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

// XSS prevention headers
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live https://checkout.razorpay.com; connect-src 'self' ws: wss: https://va.vercel-scripts.com https://vercel.live https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com https://nominatim.openstreetmap.org https://server.arcgisonline.com; img-src 'self' data: https: https://api.iconify.design https://cdnjs.cloudflare.com https://tile.openstreetmap.org https://server.arcgisonline.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src https://checkout.razorpay.com https://api.razorpay.com;",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

// Password validation
export class PasswordValidator {
  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Session security
export class SessionSecurity {
  static generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  static hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// Request validation middleware
export function validateRequestBody<T>(
  body: unknown,
  schema: Record<string, (value: unknown) => boolean>
): { valid: boolean; errors: string[]; data?: T } {
  const errors: string[] = [];
  const validatedData: Record<string, unknown> = {};

  for (const [field, validator] of Object.entries(schema)) {
    const value = (body as Record<string, unknown>)?.[field];

    if (!validator(value)) {
      errors.push(`Invalid value for field: ${field}`);
    } else {
      validatedData[field] = value;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (validatedData as T) : undefined,
  };
}

// Security headers middleware
export function securityHeadersMiddleware() {
  const headers = new Headers();

  // Content Security Policy
  headers.set(
    'Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss: https:;"
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
