import 'server-only';
import { revalidatePath } from 'next/cache';
import { ChangedProduct } from './orders';

/**
 * Product and category pages are prerendered with the stock they show. After an order changes
 * stock, Next.js regenerates them on their next request. Best effort: the order has already
 * happened, and the cart and checkout checks read stock live, so a failure is only logged.
 */
export const revalidateProductPages = (products: ChangedProduct[]) => {
  const paths = new Set(
    products.flatMap(({ slug, category }) => [`/product/${slug}`, `/category/${category}`])
  );
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (error) {
      console.error(`Could not revalidate ${path}: ${(error as Error).message}`);
    }
  }
};
