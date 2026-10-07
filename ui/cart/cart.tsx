'use client';

import { useState } from 'react';
import { formatAmount } from '@/lib/helpers';
import { placeholderCartItems } from '@/lib/placeholder-cart';
import { ButtonLink } from '../button';
import Modal from '../modal';
import CartItem from './cart-item';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const Cart = ({ isOpen, onClose }: Props) => {
  const [items, setItems] = useState(placeholderCartItems);

  const itemCount = items.length;
  const total = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  const handleQtyChange = (slug: string, quantity: number) => {
    setItems((prev) =>
      quantity === 0
        ? prev.filter((item) => item.slug !== slug)
        : prev.map((item) => (item.slug === slug ? { ...item, quantity } : item))
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-center p-6 md:justify-end md:px-10 xl:px-0">
        <div className="max-w-94 flex-grow rounded-lg bg-white px-7 py-8 md:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-18 text-black uppercase">Cart ({itemCount})</h3>
            {items.length > 0 && (
              <button
                onClick={() => setItems([])}
                className="text-15 text-black/50 underline transition-colors hover:text-primary"
              >
                Remove all
              </button>
            )}
          </div>

          {items.length > 0 ? (
            <ul className="grid gap-6">
              {items.map((item) => (
                <CartItem
                  key={item.slug}
                  name={item.name}
                  priceCents={item.priceCents}
                  qty={item.quantity}
                  image={item.image}
                  onQtyChange={(qty) => handleQtyChange(item.slug, qty)}
                />
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-15 text-black/50">Your cart is empty.</p>
          )}

          <div className="mt-8 mb-6 flex justify-between">
            <p className="text-15 text-black/50 uppercase">Total</p>
            <p className="text-18 tracking-normal text-black">{formatAmount(total)}</p>
          </div>
          {items.length > 0 && (
            <ButtonLink href="/checkout" onClick={onClose} fullWidth>
              Checkout
            </ButtonLink>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Cart;
