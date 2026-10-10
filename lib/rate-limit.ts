import 'server-only';
import { db } from './db';

export type RateLimitRule = { limit: number; windowMs: number };

/** Payment attempts per client IP: generous for shoppers, stops scripted spam */
export const PAYMENT_ATTEMPTS: RateLimitRule = { limit: 10, windowMs: 10 * 60 * 1000 };

/**
 * Counts one attempt for `key` in the current fixed window and says whether it's allowed. One
 * atomic upsert, so concurrent attempts can't both slip under the limit.
 */
export const takeRateLimit = async (
  key: string,
  { limit, windowMs }: RateLimitRule,
  now = new Date()
) => {
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const [{ count }] = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "windowStart", "count") VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateLimit"."count" + 1
    RETURNING "count"`;

  // The first hit of a window clears finished windows, so the table stays small
  if (count === 1) {
    await db.rateLimit.deleteMany({ where: { windowStart: { lt: windowStart } } });
  }
  return count <= limit;
};
