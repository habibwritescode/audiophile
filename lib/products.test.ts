// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { seedProducts } from '../prisma/seed-products';
import data from './data.json';
import { db } from './db';
import { getAllProductSlugs, getProduct, getProductsByCategory, isCategory } from './products';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe('isCategory', () => {
  it('accepts the three categories and rejects anything else', () => {
    expect(['headphones', 'speakers', 'earphones'].every(isCategory)).toBe(true);
    expect(isCategory('nope')).toBe(false);
  });
});

describe.skipIf(!hasDatabase)('products from the database', () => {
  it('returns a product with the same content as the seed data', async () => {
    const source = data.find((product) => product.slug === 'zx9-speaker')!;

    const product = await getProduct('zx9-speaker');

    expect(product).toMatchObject({
      slug: source.slug,
      name: source.name,
      shortName: 'ZX9',
      category: 'speakers',
      new: source.new,
      priceCents: source.price * 100,
      description: source.description,
      features: source.features,
      image: source.image,
      categoryImage: source.categoryImage,
      gallery: source.gallery,
      includes: source.includes,
      cartImage: '/assets/cart/image-zx9-speaker.jpg',
    });
    expect(product?.others).toEqual(source.others);
  });

  it('returns null for an unknown product', async () => {
    expect(await getProduct('nope')).toBeNull();
  });

  it('returns a category’s products in their original order', async () => {
    const headphones = await getProductsByCategory('headphones');

    expect(headphones.map((product) => product.slug)).toEqual([
      'xx59-headphones',
      'xx99-mark-one-headphones',
      'xx99-mark-two-headphones',
    ]);
  });

  it('lists every product slug', async () => {
    expect((await getAllProductSlugs()).sort()).toEqual(data.map((p) => p.slug).sort());
  });

  it('can be re-seeded without duplicating rows or resetting stock', async () => {
    await db.product.update({ where: { slug: 'zx7-speaker' }, data: { stock: 4 } });
    try {
      await seedProducts(db);

      expect(await db.product.count()).toBe(6);
      expect(await db.relatedProduct.count()).toBe(18);
      expect((await getProduct('zx7-speaker'))?.stock).toBe(4);
    } finally {
      await db.product.update({ where: { slug: 'zx7-speaker' }, data: { stock: 10 } });
    }
  });

  it('rejects negative stock', async () => {
    await expect(
      db.product.update({ where: { slug: 'zx9-speaker' }, data: { stock: -1 } })
    ).rejects.toThrow(/Product_stock_non_negative/);
  });
});
