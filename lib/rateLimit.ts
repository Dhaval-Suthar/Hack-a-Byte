// Simple in-memory rate limiter (non-distributed). Replace with Redis for multi-instance.
interface Bucket { count: number; reset: number }
const G = global as unknown as { __rl?: Record<string, Bucket> };
if (!G.__rl) G.__rl = {};

export function ensureRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  let bucket = G.__rl![key];
  if (!bucket || now > bucket.reset) {
    bucket = { count: 0, reset: now + windowMs };
    G.__rl![key] = bucket;
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, reset: bucket.reset };
  }
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, reset: bucket.reset };
}

export function resetRateLimit(key?: string) {
  if (!key) { G.__rl = {}; return; }
  delete G.__rl?.[key];
}

