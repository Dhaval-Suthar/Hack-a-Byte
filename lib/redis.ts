import { createClient, RedisClientType } from 'redis';

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
