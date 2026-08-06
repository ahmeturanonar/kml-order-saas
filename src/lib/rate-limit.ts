import { LRUCache } from "lru-cache";

type Bucket = {
  count: number;
  expiresAt: number;
};

const cache = new LRUCache<string, Bucket>({
  max: 5000,
  ttl: 1000 * 60 * 15,
});

export function assertRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = cache.get(key);

  if (!bucket || bucket.expiresAt <= now) {
    cache.set(key, { count: 1, expiresAt: now + windowMs }, { ttl: windowMs });
    return;
  }

  if (bucket.count >= limit) {
    throw new Error("Too many requests. Please try again later.");
  }

  cache.set(
    key,
    { count: bucket.count + 1, expiresAt: bucket.expiresAt },
    { ttl: bucket.expiresAt - now },
  );
}
