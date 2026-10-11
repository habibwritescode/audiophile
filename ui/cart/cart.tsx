'use client';

import { useCallback, useEffect, useState } from 'react';
import { validateCart } from '@/app/checkout/actions';
import { toCartRequest } from '@/lib/cart-check';
import { cn, formatAmount } from '@/lib/helpers';
import { useCartStore } from '@/lib/cart-store';
import { ButtonLink } from '../button';
import Modal from '../modal';
import CartItem from './cart-item';

/**
 * Which edges of a scroll box have more content beyond them. Phones hide scrollbars, so a soft fade
 * on those edges is the hint that the cart scrolls; none shows when everything fits. Rechecked on
 * scroll and when the box or its content resizes (notes growing in, items removed). A ref callback,
 * not an effect: the modal mounts its contents a moment after opening, so it attaches whenever the
 * box actually appears.
 */
const useScrollFades = () => {
  const [fades, setFades] = useState({ top: false, bottom: false });

  const scroller = useCallback((box: HTMLDivElement | null) => {
    if (!box) return;
    const update = () =>
      setFades((current) => {
        const top = box.scrollTop > 1;
        const bottom = box.scrollTop + box.clientHeight < box.scrollHeight - 1;
        return current.top === top && current.bottom === bottom ? current : { top, bottom };
      });
    update();
    box.addEventListener('scroll', update, { passive: true });
    // Absent in very old browsers (and jsdom): the fade then only follows scrolling
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    resize?.observe(box);
    if (box.firstElementChild) resize?.observe(box.firstElementChild);
    return () => {
      box.removeEventListener('scroll', update);
      resize?.disconnect();
    };
  }, []);

  return { scroller, fades };
};

const FADE = '24px';

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
  const { scroller, fades } = useScrollFades();

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

  // Below 375px (narrower than the design's smallest frame) the padding and stepper give a little,
  // so the longest product name (XX99 MK II) still fits beside the stepper on one line.
  // The card never outgrows the visible screen (dvh follows the mobile browser bar): the title and
  // the total stay put, and the notes and items scroll inside the card, not the page behind it.
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      origin="top-right"
      containerClassName="flex justify-center p-6 max-xs:p-4 md:justify-end md:px-10 xl:px-0"
      panelClassName="flex max-h-[calc(100dvh-var(--header-height)-3rem)] max-w-94 flex-grow flex-col rounded-lg bg-white px-7 py-8 max-xs:max-h-[calc(100dvh-var(--header-height)-2rem)] max-xs:px-5 md:px-8"
    >
      <div className="mb-8 flex shrink-0 items-center justify-between">
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

      {/* Room at the sides for the steppers' enlarged tap targets, which the scroll box would clip */}
      <div
        ref={scroller}
        className="-mx-3 min-h-0 flex-1 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,transparent,#000_var(--fade-top),#000_calc(100%-var(--fade-bottom)),transparent)] px-3"
        style={
          {
            '--fade-top': fades.top ? FADE : '0px',
            '--fade-bottom': fades.bottom ? FADE : '0px',
          } as React.CSSProperties
        }
      >
        <div>
          {/* The notes arrive after the cart has opened (the check is a server round trip): their space
          grows from 0fr to 1fr, so the items glide down instead of jumping by the notes' height */}
          <div
            role="status"
            className={cn(
              'grid transition-[grid-template-rows] duration-250 ease-in-out motion-reduce:transition-none',
              messages.length > 0 ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            )}
          >
            <div className="min-h-0 overflow-hidden">
              {messages.length > 0 && (
                <div className="pb-6 transition-opacity duration-200 ease-out starting:opacity-0">
                  <p className="mb-2 text-15 font-bold text-black">We updated your cart:</p>
                  <ul className="grid gap-1 text-15 text-black/75">
                    {messages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
        </div>
      </div>

      <div className="mt-8 mb-6 flex shrink-0 justify-between">
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
