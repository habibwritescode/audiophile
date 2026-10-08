'use client';

import { useEffect, useRef, useState } from 'react';
import { CartLine, useCartStore } from '@/lib/cart-store';
import Button from '@/ui/button';
import QuantitySelector from '@/ui/quantity-selector';

export const ADDED_FEEDBACK_MS = 2000;

type Props = {
  product: Omit<CartLine, 'quantity'>;
};

const AddToCart = ({ product }: Props) => {
  const [qtyToAdd, setQtyToAdd] = useState(1);
  const [added, setAdded] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const add = useCartStore((state) => state.add);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const handleAddToCart = () => {
    add(product, qtyToAdd);
    setAdded(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setAdded(false), ADDED_FEEDBACK_MS);
  };

  return (
    <div className="flex gap-4">
      <QuantitySelector value={qtyToAdd} handleChange={setQtyToAdd} />
      <Button onClick={handleAddToCart} className="min-w-40">
        {added ? 'Added' : 'Add To Cart'}
      </Button>
      <span role="status" className="sr-only">
        {added ? 'Added to cart' : ''}
      </span>
    </div>
  );
};

export default AddToCart;
