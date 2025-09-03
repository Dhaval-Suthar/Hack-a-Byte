import { withRedis } from './redis';
import { ensureRateLimit } from './rateLimit';

interface RateLimitResult { allowed: boolean; remaining: number; reset: number; }

export async function redisRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const windowKey = `rl:${key}:${Math.floor(now / windowMs)}`;
  const res = await withRedis(async r => {
    const multi = r.multi();
    multi.incr(windowKey);
    multi.pTTL(windowKey);
    const replies = await multi.exec();
    if (!replies) return { count: 1, ttl: windowMs };
  const countRaw = replies[0] as unknown as number;
  const ttlRaw = replies[1] as unknown as number;
    if (ttlRaw === -1) {
      await r.pExpire(windowKey, windowMs);
    }
    const count = typeof countRaw === 'number' ? countRaw : parseInt(String(countRaw), 10);
    const ttl = ttlRaw > 0 ? ttlRaw : windowMs;
    return { count, ttl };
  });
  if (!res) {
    // Fallback to in-process limiter (shared with legacy ensureRateLimit) for tests / no-Redis environments
    const local = ensureRateLimit(`redis-fallback:${key}`, limit, windowMs);
    return { allowed: local.allowed, remaining: local.remaining, reset: local.reset };
  }
  const remaining = Math.max(0, limit - res.count);
  return { allowed: res.count <= limit, remaining, reset: now + res.ttl };
}
