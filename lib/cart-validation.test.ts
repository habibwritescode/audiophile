// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { checkCart, InvalidCartError, MAX_CART_LINES, parseCartRequest } from './cart-validation';
import { db } from './db';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe('parseCartRequest', () => {
  it('merges a product listed twice', () => {
    expect(
      parseCartRequest([
        { slug: 'zx9-speaker', quantity: 2 },
        { slug: 'zx9-speaker', quantity: 3 },
      ])
    ).toEqual([{ slug: 'zx9-speaker', quantity: 5 }]);
  });

  it('rejects merged quantities above 99', () => {
    expect(() =>
      parseCartRequest([
        { slug: 'zx9-speaker', quantity: 60 },
        { slug: 'zx9-speaker', quantity: 60 },
      ])
    ).toThrow(InvalidCartError);
  });

  it('accepts a well-formed cart', () => {
    expect(parseCartRequest([{ slug: 'zx9-speaker', quantity: 2 }])).toEqual([
      { slug: 'zx9-speaker', quantity: 2 },
    ]);
  });

  it.each([
    ['not a list', { slug: 'zx9-speaker', quantity: 1 }],
    [
      'too many lines',
      Array.from({ length: MAX_CART_LINES + 1 }, () => ({ slug: 'a', quantity: 1 })),
    ],
    ['a missing slug', [{ quantity: 1 }]],
    ['an empty slug', [{ slug: '  ', quantity: 1 }]],
    ['a non-string slug', [{ slug: 42, quantity: 1 }]],
    ['a zero quantity', [{ slug: 'zx9-speaker', quantity: 0 }]],
    ['a fractional quantity', [{ slug: 'zx9-speaker', quantity: 1.5 }]],
    ['a quantity above 99', [{ slug: 'zx9-speaker', quantity: 100 }]],
    ['a string quantity', [{ slug: 'zx9-speaker', quantity: '2' }]],
    ['a null line', [null]],
  ])('rejects %s', (_, input) => {
    expect(() => parseCartRequest(input)).toThrow(InvalidCartError);
  });
});

describe.skipIf(!hasDatabase)('checkCart', () => {
  it('returns stock, price and display fields for each product', async () => {
    expect(await checkCart([{ slug: 'zx9-speaker', quantity: 1 }])).toEqual([
      {
        slug: 'zx9-speaker',
        exists: true,
        available: 10,
        priceCents: 450000,
        shortName: 'ZX9',
        cartImage: '/assets/cart/image-zx9-speaker.jpg',
      },
    ]);
  });

  it('reports low and sold-out stock as seeded', async () => {
    const result = await checkCart([
      { slug: 'xx59-headphones', quantity: 5 },
      { slug: 'xx99-mark-one-headphones', quantity: 1 },
    ]);

    expect(result.map((line) => line.exists && [line.slug, line.available])).toEqual([
      ['xx59-headphones', 2],
      ['xx99-mark-one-headphones', 0],
    ]);
  });

  it('reports a product that does not exist', async () => {
    expect(await checkCart([{ slug: 'nope', quantity: 1 }])).toEqual([
      { slug: 'nope', exists: false },
    ]);
  });

  it('returns the database price, whatever the cart had', async () => {
    await db.product.update({ where: { slug: 'yx1-earphones' }, data: { priceCents: 64900 } });
    try {
      const [line] = await checkCart([{ slug: 'yx1-earphones', quantity: 1 }]);

      expect(line).toMatchObject({ exists: true, priceCents: 64900 });
    } finally {
      await db.product.update({ where: { slug: 'yx1-earphones' }, data: { priceCents: 59900 } });
    }
  });

  it('answers once per product when a slug repeats', async () => {
    const result = await checkCart([
      { slug: 'zx7-speaker', quantity: 1 },
      { slug: 'zx7-speaker', quantity: 2 },
    ]);

    expect(result.map((line) => line.slug)).toEqual(['zx7-speaker']);
  });

  it('rejects malformed input before touching the database', async () => {
    await expect(checkCart('drop table')).rejects.toThrow(InvalidCartError);
  });
});
