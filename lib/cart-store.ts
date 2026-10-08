import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  CartCheckLine,
  CartLine,
  MAX_CART_LINES,
  MAX_QUANTITY,
  reconcileCart,
  sanitizeCartLines,
} from './cart-check';

export type { CartLine } from './cart-check';
export { MAX_QUANTITY } from './cart-check';

type CartState = {
  lines: CartLine[];
  add: (product: Omit<CartLine, 'quantity'>, quantity: number) => void;
  /** 0 removes the line */
  setQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
  /** Applies a server check and returns the messages describing what changed */
  applyServerCheck: (check: CartCheckLine[]) => string[];
};

const clamp = (quantity: number) => Math.min(Math.max(Math.trunc(quantity), 0), MAX_QUANTITY);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      add: (product, quantity) =>
        set(({ lines }) => {
          const existing = lines.find((line) => line.slug === product.slug);
          if (!existing) {
            if (lines.length >= MAX_CART_LINES) return { lines };
            return { lines: [...lines, { ...product, quantity: clamp(quantity) }] };
          }
          return {
            lines: lines.map((line) =>
              line.slug === product.slug
                ? { ...line, ...product, quantity: clamp(line.quantity + quantity) }
                : line
            ),
          };
        }),

      setQuantity: (slug, quantity) =>
        set(({ lines }) => ({
          lines: clamp(quantity)
            ? lines.map((line) =>
                line.slug === slug ? { ...line, quantity: clamp(quantity) } : line
              )
            : lines.filter((line) => line.slug !== slug),
        })),

      clear: () => set({ lines: [] }),

      applyServerCheck: (check) => {
        const current = get().lines;
        const { lines, messages } = reconcileCart(current, check);
        if (lines !== current) set({ lines });
        return messages;
      },
    }),
    {
      name: 'audiophile-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ lines }) => ({ lines }),
      // Without migrate, zustand drops an old-version cart but logs console.error. Discard quietly.
      migrate: () => ({ lines: [] }),
      // Never trust what comes back from storage: keep only well-formed lines
      merge: (persisted, current) => ({
        ...current,
        lines: sanitizeCartLines((persisted as { lines?: unknown } | undefined)?.lines),
      }),
      // The server renders an empty cart; the stored one loads after the first browser render
      // (see CartHydration), so server HTML and the first client render always match.
      skipHydration: true,
    }
  )
);

/** False on the server and until the stored cart has loaded in the browser */
export const useCartHydrated = () =>
  useSyncExternalStore(
    (onChange) => useCartStore.persist.onFinishHydration(onChange),
    () => useCartStore.persist.hasHydrated(),
    () => false
  );
