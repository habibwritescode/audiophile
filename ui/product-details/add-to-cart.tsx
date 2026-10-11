'use client';

import { useEffect, useRef, useState } from 'react';
import { useCartModal } from '@/lib/cart-modal';
import { CartLine, MAX_QUANTITY, useCartHydrated, useCartStore } from '@/lib/cart-store';
import Button from '@/ui/button';
import QuantitySelector from '@/ui/quantity-selector';

export const ADDED_FEEDBACK_MS = 2000;

type Props = {
  product: Omit<CartLine, 'quantity'>;
  /** As of the page's last render; checkout re-checks it against the database */
  stock: number;
};

const AddToCart = ({ product, stock }: Props) => {
  const [qtyToAdd, setQtyToAdd] = useState(1);
  const [added, setAdded] = useState(false);
  // Stays after the "Added" label reverts: the way on to the cart from here
  const [hasAdded, setHasAdded] = useState(false);
  const openCart = useCartModal((state) => state.setOpen);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const add = useCartStore((state) => state.add);
  const inCart = useCartStore(
    (state) => state.lines.find((line) => line.slug === product.slug)?.quantity ?? 0
  );
  // Disabled in the server HTML: a click before the page's JavaScript runs would be lost, and the
  // room left depends on the stored cart
  const ready = useCartHydrated();

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const room = Math.max(0, Math.min(stock, MAX_QUANTITY) - inCart);
  const quantity = Math.max(1, Math.min(qtyToAdd, room));

  const handleAddToCart = () => {
    add(product, quantity);
    setAdded(true);
    setHasAdded(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setAdded(false), ADDED_FEEDBACK_MS);
  };

  const label = added
    ? 'Added'
    : stock <= 0
      ? 'Sold out'
      : ready && room === 0
        ? `All ${Math.min(stock, inCart)} in cart`
        : 'Add To Cart';

  return (
    <div>
      <div className="flex gap-4">
        <QuantitySelector
          value={quantity}
          handleChange={setQtyToAdd}
          max={room}
          disabled={!ready || room === 0}
        />
        <Button onClick={handleAddToCart} className="min-w-40" disabled={!ready || room === 0}>
          {label}
        </Button>
        <span role="status" className="sr-only">
          {added ? 'Added to cart' : ''}
        </span>
      </div>
      {hasAdded && (
        <button
          type="button"
          onClick={() => openCart(true)}
          className="mt-4 text-15 font-bold text-primary underline active:opacity-60"
        >
          View cart
        </button>
      )}
    </div>
  );
};

export default AddToCart;
