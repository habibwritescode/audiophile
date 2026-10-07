import data from '../lib/data.json';
import { PrismaClient } from '../lib/generated/prisma/client';
import { Category } from '../lib/generated/prisma/enums';

// Upserts every product from lib/data.json, then their related products. Safe to run any number
// of times: content follows the repo, stock is only set when a product is first created.
const shortNames: Record<string, string> = {
  'yx1-earphones': 'YX1',
  'xx59-headphones': 'XX59',
  'xx99-mark-one-headphones': 'XX99 MK I',
  'xx99-mark-two-headphones': 'XX99 MK II',
  'zx7-speaker': 'ZX7',
  'zx9-speaker': 'ZX9',
};

// Only applied when a product is first created, so re-seeding never undoes orders
const initialStock: Record<string, number> = {
  'xx59-headphones': 2,
  'xx99-mark-one-headphones': 0,
};
const DEFAULT_STOCK = 10;

// Each product's "You may also like" card image is the same wherever it appears. YX1 never
// appears as a related product and has no such image, so it falls back to its product shot.
const thumbnails = new Map(
  data.flatMap((product) => product.others.map((other) => [other.slug, other.image] as const))
);
const cardNames = new Map(
  data.flatMap((product) => product.others.map((other) => [other.slug, other.name] as const))
);

const categories: string[] = Object.values(Category);

export const seedProducts = async (db: PrismaClient) => {
  for (const product of data) {
    // The seed runs on every deploy: fail with the product's name rather than a Prisma error
    const shortName = shortNames[product.slug];
    if (!shortName) throw new Error(`No shortName for ${product.slug}: add it to shortNames`);
    if (!categories.includes(product.category)) {
      throw new Error(`Unknown category "${product.category}" for ${product.slug}`);
    }

    const fields = {
      name: product.name,
      shortName,
      cardName: cardNames.get(product.slug) ?? product.name,
      category: product.category as Category,
      isNew: product.new,
      priceCents: product.price * 100,
      description: product.description,
      features: product.features,
      image: product.image,
      categoryImage: product.categoryImage,
      thumbnail: thumbnails.get(product.slug) ?? product.image,
      cartImage: `/assets/cart/image-${product.slug}.jpg`,
      gallery: product.gallery,
      includes: product.includes,
    };

    await db.product.upsert({
      where: { slug: product.slug },
      create: {
        slug: product.slug,
        stock: initialStock[product.slug] ?? DEFAULT_STOCK,
        ...fields,
      },
      update: fields,
    });
  }

  // Related products reference other products by id, so they go in once every product exists
  const ids = new Map(
    (await db.product.findMany({ select: { id: true, slug: true } })).map((p) => [p.slug, p.id])
  );
  const idFor = (slug: string) => {
    const id = ids.get(slug);
    if (id === undefined) throw new Error(`Unknown related product ${slug}`);
    return id;
  };

  for (const product of data) {
    const productId = idFor(product.slug);
    const related = product.others.map((other, position) => ({
      productId,
      relatedId: idFor(other.slug),
      position,
    }));

    await db.$transaction([
      db.relatedProduct.deleteMany({
        where: { productId, relatedId: { notIn: related.map((r) => r.relatedId) } },
      }),
      ...related.map((row) =>
        db.relatedProduct.upsert({
          where: { productId_relatedId: { productId, relatedId: row.relatedId } },
          create: row,
          update: { position: row.position },
        })
      ),
    ]);
  }

  return data.length;
};
