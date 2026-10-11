import type { CartLine } from '@/lib/cart-check';

// Dev-only data for the "Demo data / Worst case" toggle (ui/dev/data-toggle.tsx). Carts enter
// through the cart store, as a stored cart does, so the server check reacts to them for real.

const cart = (slug: string, shortName: string, priceCents: number, quantity: number): CartLine => ({
  slug,
  shortName,
  cartImage: `/assets/cart/image-${slug}.jpg`,
  priceCents,
  quantity,
});

export type Dataset = 'demo' | 'worst' | 'empty' | 'one';

export const carts: Record<Dataset, CartLine[]> = {
  demo: [cart('xx59-headphones', 'XX59', 89900, 1), cart('yx1-earphones', 'YX1', 59900, 2)],
  // A cart saved weeks ago, by an older build, by someone who kept pressing "+":
  worst: [
    // At the 99 cap, far beyond stock
    cart('zx9-speaker', 'ZX9', 450000, 99),
    // Display name stored by an older build (full product name), corrected by the check
    cart('xx99-mark-two-headphones', 'XX99 Mark II Headphones', 299900, 3),
    // Sold out since it was added
    cart('xx99-mark-one-headphones', 'XX99 MK I', 175000, 1),
    // Price changed since it was added
    cart('xx59-headphones', 'XX59', 79900, 2),
    cart('yx1-earphones', 'YX1', 59900, 12),
    cart('zx7-speaker', 'ZX7', 350000, 10),
    // Discontinued: no longer in the catalog, and its image is gone (404)
    cart('xx99-mark-three-headphones', 'XX99 MK III', 349900, 1),
  ],
  empty: [],
  one: [cart('zx7-speaker', 'ZX7', 350000, 1)],
};

/** What the order confirmation shows for each dataset (it gets its data as props) */
export const confirmations: Record<Dataset, { lines: CartLine[]; orderNumber: number } | null> = {
  demo: { lines: carts.demo, orderNumber: 123 },
  // Every product at its full seeded stock, and the order number at its column's limit (Int)
  worst: {
    lines: [
      cart('zx9-speaker', 'ZX9', 450000, 10),
      cart('zx7-speaker', 'ZX7', 350000, 10),
      cart('xx99-mark-two-headphones', 'XX99 MK II', 299900, 10),
      cart('yx1-earphones', 'YX1', 59900, 10),
      cart('xx59-headphones', 'XX59', 89900, 2),
    ],
    orderNumber: 2147483647,
  },
  empty: null,
  one: { lines: carts.one, orderNumber: 1 },
};
