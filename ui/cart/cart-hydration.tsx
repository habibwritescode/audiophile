'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/lib/cart-store';

/** Loads the stored cart once the page has hydrated. Rendered once, in the root layout. */
const CartHydration = () => {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return null;
};

export default CartHydration;
