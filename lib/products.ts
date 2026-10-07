import { cache } from 'react';
import { db } from './db';
import { Category } from './generated/prisma/enums';
import { Prisma } from './generated/prisma/client';
import { IProductGallery, Product, SimilarProduct } from './types';

export const categories: Category[] = Object.values(Category);

export const isCategory = (value: string): value is Category =>
  (categories as string[]).includes(value);

const productInclude = {
  relatedTo: { orderBy: { position: 'asc' }, include: { related: true } },
} satisfies Prisma.ProductInclude;

export type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

// JSON columns are typed as JsonValue; the seed is the only writer and stores these shapes
export const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  shortName: row.shortName,
  cartImage: row.cartImage,
  stock: row.stock,
  category: row.category,
  new: row.isNew,
  priceCents: row.priceCents,
  description: row.description,
  features: row.features,
  image: row.image as Product['image'],
  categoryImage: row.categoryImage as Product['categoryImage'],
  gallery: row.gallery as unknown as IProductGallery,
  includes: row.includes as Product['includes'],
  others: row.relatedTo.map(
    ({ related }): SimilarProduct => ({
      slug: related.slug,
      name: related.cardName,
      image: related.thumbnail as SimilarProduct['image'],
    })
  ),
});

// cache() dedupes the lookup within one render: generateMetadata and the page both need it
export const getProduct = cache(async (slug: string) => {
  const row = await db.product.findUnique({ where: { slug }, include: productInclude });
  return row ? toProduct(row) : null;
});

export const getProductsByCategory = async (category: Category) => {
  const rows = await db.product.findMany({
    where: { category },
    include: productInclude,
    // Same order as lib/data.json, which the seed inserts in sequence
    orderBy: { id: 'asc' },
  });
  return rows.map(toProduct);
};

export const getAllProductSlugs = async () =>
  (await db.product.findMany({ select: { slug: true } })).map(({ slug }) => slug);
