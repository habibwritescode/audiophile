import { CartCheckLine, MAX_CART_LINES, MAX_QUANTITY } from './cart-check';
import { db } from './db';

export { MAX_CART_LINES } from './cart-check';

export type CartCheckRequest = { slug: string; quantity: number }[];

export class InvalidCartError extends Error {}

/** The request comes from the browser through a Server Action: check every field */
export const parseCartRequest = (input: unknown): CartCheckRequest => {
  if (!Array.isArray(input)) throw new InvalidCartError('Cart must be a list');
  if (input.length > MAX_CART_LINES) {
    throw new InvalidCartError(`Cart can have at most ${MAX_CART_LINES} lines`);
  }

  const lines = input.map((line, index) => {
    const { slug, quantity } = (line ?? {}) as Record<string, unknown>;
    if (typeof slug !== 'string' || !slug.trim() || slug.length > 100) {
      throw new InvalidCartError(`Line ${index + 1}: invalid product`);
    }
    if (
      !Number.isInteger(quantity) ||
      (quantity as number) < 1 ||
      (quantity as number) > MAX_QUANTITY
    ) {
      throw new InvalidCartError(`Line ${index + 1}: quantity must be 1–${MAX_QUANTITY}`);
    }
    return { slug, quantity: quantity as number };
  });

  // A product listed twice is checked as one line, or each half could pass the stock check alone
  const merged = new Map<string, number>();
  for (const { slug, quantity } of lines) merged.set(slug, (merged.get(slug) ?? 0) + quantity);
  return [...merged].map(([slug, quantity]) => {
    if (quantity > MAX_QUANTITY) {
      throw new InvalidCartError(`${slug}: quantity must be 1–${MAX_QUANTITY}`);
    }
    return { slug, quantity };
  });
};

/**
 * Current facts for every product in the cart, from one query. Client prices and names are
 * never sent here; the browser reconciles its copy against these (see reconcileCart).
 */
export const checkCart = async (input: unknown): Promise<CartCheckLine[]> => {
  const slugs = [...new Set(parseCartRequest(input).map((line) => line.slug))];
  const products = await db.product.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, stock: true, priceCents: true, shortName: true, cartImage: true },
  });
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  return slugs.map((slug) => {
    const product = bySlug.get(slug);
    if (!product) return { slug, exists: false };
    return {
      slug,
      exists: true,
      available: product.stock,
      priceCents: product.priceCents,
      shortName: product.shortName,
      cartImage: product.cartImage,
    };
  });
};
