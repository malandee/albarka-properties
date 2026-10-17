import { db } from '@/lib/db';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding-window rate limit backed by the RateLimitHit table so that limits hold across
 * multiple server instances. Each call records one hit when it is allowed or blocked.
 */
export async function consumeRateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const since = new Date(Date.now() - windowSeconds * 1000);
  const count = await db.rateLimitHit.count({ where: { bucket, createdAt: { gte: since } } });
  if (count >= limit) {
    const oldest = await db.rateLimitHit.findFirst({
      where: { bucket, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    const retryAt = oldest ? oldest.createdAt.getTime() + windowSeconds * 1000 : Date.now() + windowSeconds * 1000;
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((retryAt - Date.now()) / 1000)) };
  }
  await db.rateLimitHit.create({ data: { bucket } });
  return { allowed: true, remaining: limit - count - 1, retryAfterSeconds: 0 };
}

/** Removes expired counters. Safe to run periodically. */
export async function pruneRateLimits(olderThanSeconds = 24 * 3600): Promise<number> {
  const res = await db.rateLimitHit.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - olderThanSeconds * 1000) } },
  });
  return res.count;
}
