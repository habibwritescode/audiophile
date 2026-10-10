// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { db } from './db';
import { takeRateLimit } from './rate-limit';

const hasDatabase = Boolean(process.env.DATABASE_URL);
const rule = { limit: 3, windowMs: 60_000 };
// A fixed point in a window, so tests don't depend on the clock
const t0 = new Date('2026-01-01T00:00:10Z');
const at = (msAfter: number) => new Date(t0.getTime() + msAfter);

describe.skipIf(!hasDatabase)('takeRateLimit', () => {
  it('allows the limit, then refuses within the same window', async () => {
    const key = `test:${randomUUID()}`;

    const results = [];
    for (let i = 0; i < 4; i++) results.push(await takeRateLimit(key, rule, at(i * 1000)));

    expect(results).toEqual([true, true, true, false]);
  });

  it('starts fresh in the next window', async () => {
    const key = `test:${randomUUID()}`;
    for (let i = 0; i < 4; i++) await takeRateLimit(key, rule, t0);

    expect(await takeRateLimit(key, rule, at(60_000))).toBe(true);
  });

  it('counts each key separately', async () => {
    const [first, second] = [`test:${randomUUID()}`, `test:${randomUUID()}`];
    for (let i = 0; i < 3; i++) await takeRateLimit(first, rule, t0);

    expect(await takeRateLimit(first, rule, t0)).toBe(false);
    expect(await takeRateLimit(second, rule, t0)).toBe(true);
  });

  it('never lets concurrent attempts exceed the limit', async () => {
    const key = `test:${randomUUID()}`;

    const results = await Promise.all(
      Array.from({ length: 10 }, () => takeRateLimit(key, rule, t0))
    );

    expect(results.filter(Boolean)).toHaveLength(3);
  });

  it('clears finished windows when a new one starts', async () => {
    const key = `test:${randomUUID()}`;
    await takeRateLimit(key, rule, t0);

    await takeRateLimit(`test:${randomUUID()}`, rule, at(120_000));

    expect(await db.rateLimit.count({ where: { key } })).toBe(0);
  });
});
