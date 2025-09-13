import { createClient, RedisClientType } from 'redis';
import { logger } from '@/lib/logger';

let client: RedisClientType | null = null;
let enabled = false;

export async function getRedis() {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  client = createClient({ url });
  client.on('error', () => { /* log suppressed to avoid test noise */ });
  await client.connect();
  enabled = true;
  return client;
}

export function redisEnabled() { return enabled; }

export async function withRedis<T>(fn: (c: RedisClientType) => Promise<T>): Promise<T | null> {
  const c = await getRedis();
  if (!c) return null;
  return fn(c);
}

// Cache utilities
export class Cache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const result = await withRedis(async (client) => {
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
      });
      return result || null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  static async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    try {
      await withRedis(async (client) => {
        await client.setEx(key, ttlSeconds, JSON.stringify(value));
      });
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await withRedis(async (client) => {
        await client.del(key);
      });
    } catch (error) {
      logger.error('Cache delete error', { key, error });
    }
  }

  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

// Specific cache implementations
export class DeviceCache {
  static getKey(deviceId: string): string {
    return `device:${deviceId}`;
  }

  static async getDevice(deviceId: string) {
    return Cache.get(this.getKey(deviceId));
  }

  static async setDevice(deviceId: string, device: Record<string, unknown>, ttl = 300) {
    return Cache.set(this.getKey(deviceId), device, ttl);
  }

  static async invalidateDevice(deviceId: string) {
    return Cache.del(this.getKey(deviceId));
  }
}

export class LeaderboardCache {
  static getKey(game: string, difficulty?: string): string {
    return `leaderboard:${game}${difficulty ? `:${difficulty}` : ''}`;
  }

  static async getLeaderboard(game: string, difficulty?: string) {
    return Cache.get(this.getKey(game, difficulty));
  }

  static async setLeaderboard(game: string, difficulty: string | undefined, data: Record<string, unknown>, ttl = 600) {
    return Cache.set(this.getKey(game, difficulty), data, ttl);
  }

  static async invalidateLeaderboard(game: string, difficulty?: string) {
    return Cache.del(this.getKey(game, difficulty));
  }
}

export class TeamCache {
  static getKey(teamId: string): string {
    return `team:${teamId}`;
  }

  static async getTeam(teamId: string) {
    return Cache.get(this.getKey(teamId));
  }

  static async setTeam(teamId: string, team: Record<string, unknown>, ttl = 300) {
    return Cache.set(this.getKey(teamId), team, ttl);
  }

  static async invalidateTeam(teamId: string) {
    return Cache.del(this.getKey(teamId));
  }
}

// Rate limiting with Redis
export class RateLimiter {
  static async checkLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const result = await withRedis(async (client) => {
        const now = Math.floor(Date.now() / 1000);
        const windowKey = `${key}:${Math.floor(now / windowSeconds)}`;

        const requests = await client.incr(windowKey);
        await client.expire(windowKey, windowSeconds);

        const remaining = Math.max(0, maxRequests - requests);
        const allowed = requests <= maxRequests;
        const resetTime = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

        return { allowed, remaining, resetTime };
      });

      return result || { allowed: true, remaining: maxRequests - 1, resetTime: Date.now() + windowSeconds * 1000 };
    } catch (error) {
      logger.error('Rate limit check error', { key, error });
      // Allow request on Redis failure
      return { allowed: true, remaining: maxRequests - 1, resetTime: Date.now() + windowSeconds * 1000 };
    }
  }
}
