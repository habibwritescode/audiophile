'use client';

import { useEffect, useState } from 'react';
import { validateCart } from '@/app/checkout/actions';
import { toCartRequest } from '@/lib/cart-check';
import { formatAmount } from '@/lib/helpers';
import { useCartStore } from '@/lib/cart-store';
import { ButtonLink } from '../button';
import Modal from '../modal';
import CartItem from './cart-item';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const Cart = ({ isOpen, onClose }: Props) => {
  // The modal only opens after a click, by which time the stored cart has loaded
  const items = useCartStore((state) => state.lines);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const clear = useCartStore((state) => state.clear);
  const [messages, setMessages] = useState<string[]>([]);
  const [available, setAvailable] = useState<Map<string, number>>(new Map());

  // Checks stock and prices each time the cart opens, as checkout does
  useEffect(() => {
    if (!isOpen) return;
    const checked = useCartStore.getState().lines;
    setMessages([]);
    setAvailable(new Map());
    if (checked.length === 0) return;

    let closed = false;
    validateCart(toCartRequest(checked))
      .then((facts) => {
        // An answer about a cart that has since changed is dropped; checkout checks again anyway
        if (closed || useCartStore.getState().lines !== checked) return;
        setMessages(useCartStore.getState().applyServerCheck(facts));
        setAvailable(
          new Map(facts.flatMap((fact) => (fact.exists ? [[fact.slug, fact.available]] : [])))
        );
      })
      // Best effort: the cart still works without it, and checkout won't proceed unchecked
      .catch(() => {});
    return () => {
      closed = true;
    };
  }, [isOpen]);

  // The design's title counts products; the header badge counts items
  const productCount = items.length;
  const total = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      origin="top-right"
      containerClassName="flex justify-center p-6 md:justify-end md:px-10 xl:px-0"
      panelClassName="max-w-94 flex-grow rounded-lg bg-white px-7 py-8 md:px-8"
    >
      <div className="mb-8 flex items-center justify-between">
        <h3 className="text-18 text-black uppercase">Cart ({productCount})</h3>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-15 text-black/50 underline transition-colors hover:text-primary active:text-primary"
          >
            Remove all
          </button>
        )}
      </div>

      <div role="status">
        {messages.length > 0 && (
          <div className="mb-6 transition-[opacity,translate] duration-200 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0">
            <p className="mb-2 text-15 font-bold text-black">We updated your cart:</p>
            <ul className="grid gap-1 text-15 text-black/75">
              {messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {items.length > 0 ? (
        <ul className="grid gap-6">
          {items.map((item) => (
            <CartItem
              key={item.slug}
              name={item.shortName}
              priceCents={item.priceCents}
              qty={item.quantity}
              maxQty={available.get(item.slug)}
              image={item.cartImage}
              onQtyChange={(qty) => setQuantity(item.slug, qty)}
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
    </Modal>
  );
};

export default Cart;
