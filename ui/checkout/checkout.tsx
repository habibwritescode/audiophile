'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { validateCart } from '@/app/checkout/actions';
import { CartLine, useCartHydrated, useCartStore } from '@/lib/cart-store';
import { ButtonLink } from '../button';
import GoBack from '../go-back';
import CheckoutForm from './checkout-form';
import CheckoutSummary from './summary';
import ConfirmationModal from './confirmation-modal';

const SHIPPING_FEE_CENTS = 5000;
const VAT_RATE = 0.2;

export const CHECK_FAILED_MESSAGE = 'Couldn’t check your cart, please try again.';

// A check whose cart changed underneath it is retried, but not forever: each try is a request
export const MAX_CHECK_ATTEMPTS = 3;

const totalsFor = (lines: CartLine[]) => {
  const total = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  return {
    total,
    vat: Math.round(total * VAT_RATE),
    grandTotal: total + SHIPPING_FEE_CENTS,
  };
};

type CheckResult = { ok: boolean; messages: string[] };

/**
 * Checks the cart against the database and applies any corrections. If the shopper edits the
 * cart while the check is running, the answer describes a cart that no longer exists, so it is
 * discarded and the check runs again, up to MAX_CHECK_ATTEMPTS times.
 */
const checkAndCorrectCart = async (): Promise<CheckResult> => {
  for (let attempt = 0; attempt < MAX_CHECK_ATTEMPTS; attempt++) {
    const checked = useCartStore.getState().lines;
    const facts = await validateCart(checked.map(({ slug, quantity }) => ({ slug, quantity })));
    if (useCartStore.getState().lines !== checked) continue;

    const messages = useCartStore.getState().applyServerCheck(facts);
    return { ok: messages.length === 0, messages };
  }
  throw new Error('The cart kept changing during the check');
};

const Checkout = () => {
  const hydrated = useCartHydrated();
  const lines = useCartStore((state) => state.lines);
  const clearCart = useCartStore((state) => state.clear);

  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<CartLine[] | null>(null);
  const [revealNotices, setRevealNotices] = useState(false);
  const noticesRef = useRef<HTMLDivElement>(null);

  const runCheck = useCallback(async () => {
    setIsChecking(true);
    setError('');
    try {
      const result = await checkAndCorrectCart();
      setMessages(result.messages);
      return result.ok;
    } catch {
      setError(CHECK_FAILED_MESSAGE);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check as soon as the stored cart has loaded, so problems show before the form is filled in.
  // Later edits are checked again on submit.
  useEffect(() => {
    if (hydrated && useCartStore.getState().lines.length > 0) runCheck();
  }, [hydrated, runCheck]);

  const handleSubmit = async () => {
    if (isChecking) return;
    if (await runCheck()) setConfirmedOrder(useCartStore.getState().lines);
    else setRevealNotices(true);
  };

  // A failed submit must be noticed: on small screens the summary sits below the long form.
  // Only on submit; the check on arrival shouldn't move the page.
  useEffect(() => {
    if (!revealNotices || !noticesRef.current) return;
    noticesRef.current.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    noticesRef.current.focus({ preventScroll: true });
    setRevealNotices(false);
  }, [revealNotices]);

  // Nothing until the stored cart has loaded: a full cart must never flash as empty
  if (!hydrated) return <div className="min-h-screen bg-gray-200" />;

  const notices = (messages.length > 0 || error) && (
    <div
      ref={noticesRef}
      tabIndex={-1}
      className="mb-6 rounded-lg bg-white p-6 outline-none focus-visible:ring-2 focus-visible:ring-primary md:px-8.5"
    >
      {error && (
        <p role="alert" className="text-15 font-bold text-red">
          {error}
        </p>
      )}
      {messages.length > 0 && (
        <div role="status">
          <p className="mb-3 text-15 font-bold text-black">We updated your cart:</p>
          <ul className="grid gap-1 text-15 text-black/75">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // The confirmation keeps its own copy: Back to home empties the cart before navigating away
  const confirmed = confirmedOrder ?? [];

  return (
    <>
      <div className="bg-gray-200 px-6 pt-4 pb-25 md:px-10 md:pt-12 xl:pt-20 xl:pb-35">
        <div className="mx-auto max-w-6xl">
          <GoBack />
          {lines.length === 0 && !confirmedOrder ? (
            <section className="mt-6 xl:mt-9.5">
              {notices}
              <div className="grid justify-items-center gap-6 rounded-lg bg-white px-6 py-16 text-center">
                <h1 className="text-28 text-black uppercase">Your cart is empty</h1>
                <p className="text-15 text-black/50">Add a product to check out.</p>
                <ButtonLink href="/">Continue shopping</ButtonLink>
              </div>
            </section>
          ) : (
            <section className="mt-6 grid gap-8 xl:mt-9.5 xl:grid-cols-[65%_1fr] xl:gap-7.5">
              <CheckoutForm onSubmit={handleSubmit} />
              <div className="self-start">
                {notices}
                <CheckoutSummary
                  items={lines}
                  {...totalsFor(lines)}
                  shipping={SHIPPING_FEE_CENTS}
                  isChecking={isChecking}
                />
              </div>
            </section>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={confirmedOrder !== null}
        onBackToHome={clearCart}
        items={confirmed}
        grandTotal={totalsFor(confirmed).grandTotal}
      />
    </>
  );
};

export default Checkout;
