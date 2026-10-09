'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { confirmCardPayment, startCardPayment, validateCart } from '@/app/checkout/actions';
import { CartLine, useCartHydrated, useCartStore } from '@/lib/cart-store';
import { CheckoutSubmission, PaymentMethod } from '@/lib/checkout-validation';
import { formatNaira, orderTotals, toChargeKobo } from '@/lib/pricing';
import { ButtonLink } from '../button';
import GoBack from '../go-back';
import CheckoutForm from './checkout-form';
import CheckoutSummary from './summary';
import ConfirmationModal from './confirmation-modal';

export const CHECK_FAILED_MESSAGE = 'Couldn’t check your cart, please try again.';
export const PAYMENT_CANCELLED_MESSAGE = 'Payment cancelled. You haven’t been charged.';
export const PAYMENT_FAILED_MESSAGE =
  'Payment couldn’t be completed. You haven’t been charged. Please try again.';
/** The popup reported success but the server couldn't confirm it: the card may have been charged */
export const paymentUnconfirmedMessage = (reference: string) =>
  `We couldn’t confirm your payment yet. Please don’t pay again: check again below, or if you were charged, contact us with reference ${reference}.`;
export const PAYMENT_TOO_LARGE_MESSAGE =
  'This order is too large to pay by card online. Lower the quantities or choose Cash on Delivery.';
export const CARD_UNAVAILABLE_MESSAGE =
  'Card payments are unavailable right now. Please choose Cash on Delivery.';

// A check whose cart changed underneath it is retried, but not forever: each try is a request
export const MAX_CHECK_ATTEMPTS = 3;

type CheckResult = { ok: boolean; messages: string[] };
type Busy = 'checking' | 'paying' | 'confirming' | null;
type ConfirmedOrder = { lines: CartLine[]; chargedKobo?: number };
type PendingPayment = { reference: string; lines: CartLine[]; amountKobo: number };

const cartRequest = (lines: CartLine[]) => lines.map(({ slug, quantity }) => ({ slug, quantity }));

/**
 * Checks the cart against the database and applies any corrections. If the shopper edits the
 * cart while the check is running, the answer describes a cart that no longer exists, so it is
 * discarded and the check runs again, up to MAX_CHECK_ATTEMPTS times.
 */
const checkAndCorrectCart = async (): Promise<CheckResult> => {
  for (let attempt = 0; attempt < MAX_CHECK_ATTEMPTS; attempt++) {
    const checked = useCartStore.getState().lines;
    const facts = await validateCart(cartRequest(checked));
    if (useCartStore.getState().lines !== checked) continue;

    const messages = useCartStore.getState().applyServerCheck(facts);
    return { ok: messages.length === 0, messages };
  }
  throw new Error('The cart kept changing during the check');
};

type PopupOutcome = { result: 'success'; reference: string } | { result: 'cancel' | 'error' };

/** Opens Paystack's popup for a transaction the server created. Loaded on demand: it needs `window`. */
const payInPopup = async (accessCode: string) => {
  const { default: PaystackPop } = await import('@paystack/inline-js');
  return new Promise<PopupOutcome>((resolve) => {
    new PaystackPop().resumeTransaction(accessCode, {
      onSuccess: ({ reference }) => resolve({ result: 'success', reference }),
      onCancel: () => resolve({ result: 'cancel' }),
      onError: () => resolve({ result: 'error' }),
    });
  });
};

type Props = {
  cardAvailable: boolean;
};

const Checkout = ({ cardAvailable }: Props) => {
  const hydrated = useCartHydrated();
  const lines = useCartStore((state) => state.lines);
  const clearCart = useCartStore((state) => state.clear);

  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<Busy>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    cardAvailable ? 'card' : 'cash'
  );
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  // A payment the popup reported as successful that we couldn't confirm yet. Until it's resolved,
  // submitting re-checks it instead of starting a new payment, so nobody pays twice.
  const [unconfirmed, setUnconfirmed] = useState<PendingPayment | null>(null);
  const [revealNotices, setRevealNotices] = useState(false);
  const noticesRef = useRef<HTMLDivElement>(null);

  const runCheck = useCallback(async () => {
    setBusy('checking');
    setError('');
    try {
      const result = await checkAndCorrectCart();
      setMessages(result.messages);
      return result.ok;
    } catch {
      setError(CHECK_FAILED_MESSAGE);
      return false;
    } finally {
      setBusy(null);
    }
  }, []);

  // Check as soon as the stored cart has loaded, so problems show before the form is filled in.
  // Later edits are checked again on submit.
  useEffect(() => {
    if (hydrated && useCartStore.getState().lines.length > 0) runCheck();
  }, [hydrated, runCheck]);

  /** The order succeeded: empty the cart at once, so closing the tab can't lead to paying twice */
  const completeOrder = (order: ConfirmedOrder) => {
    clearCart();
    setConfirmedOrder(order);
  };

  const fail = (message: string) => {
    setError(message);
    setRevealNotices(true);
  };

  const payByCash = async () => {
    if (await runCheck()) completeOrder({ lines: useCartStore.getState().lines });
    else setRevealNotices(true);
  };

  /**
   * The popup's word isn't proof of payment: the server checks with Paystack first. If that check
   * can't confirm it (not settled yet, network error), keep the reference and offer to check again.
   */
  const confirmPayment = async (pending: PendingPayment) => {
    setBusy('confirming');
    setError('');
    try {
      const { paid } = await confirmCardPayment(pending.reference);
      if (paid) {
        setUnconfirmed(null);
        completeOrder({ lines: pending.lines, chargedKobo: pending.amountKobo });
        return;
      }
    } catch {
      // Fall through: same as not confirmed
    } finally {
      setBusy(null);
    }
    setUnconfirmed(pending);
    fail(paymentUnconfirmedMessage(pending.reference));
  };

  const payByCard = async (customer: CheckoutSubmission['customer']) => {
    const ordered = useCartStore.getState().lines;
    setBusy('paying');
    setError('');
    setMessages([]);
    try {
      const started = await startCardPayment({
        lines: cartRequest(ordered),
        customer,
        displayedTotalCents: orderTotals(ordered).grandTotal,
      });

      if (started.status === 'cart-changed') {
        const corrections = useCartStore.getState().applyServerCheck(started.check);
        if (corrections.length) {
          setMessages(corrections);
          setRevealNotices(true);
        } else {
          fail(CHECK_FAILED_MESSAGE);
        }
        return;
      }
      if (started.status === 'too-large') return fail(PAYMENT_TOO_LARGE_MESSAGE);
      if (started.status === 'unavailable') return fail(CARD_UNAVAILABLE_MESSAGE);

      const outcome = await payInPopup(started.accessCode);
      if (outcome.result === 'success') {
        await confirmPayment({
          reference: outcome.reference,
          lines: ordered,
          amountKobo: started.amountKobo,
        });
        return;
      }
      fail(outcome.result === 'cancel' ? PAYMENT_CANCELLED_MESSAGE : PAYMENT_FAILED_MESSAGE);
    } catch {
      fail(PAYMENT_FAILED_MESSAGE);
    } finally {
      setBusy(null);
    }
  };

  const handleSubmit = async ({ paymentMethod, customer }: CheckoutSubmission) => {
    if (busy) return;
    if (unconfirmed) await confirmPayment(unconfirmed);
    else if (paymentMethod === 'card') await payByCard(customer);
    else await payByCash();
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
      {unconfirmed && (
        <button
          type="button"
          onClick={() => confirmPayment(unconfirmed)}
          disabled={busy !== null}
          className="mt-3 text-15 font-bold text-primary underline disabled:opacity-50"
        >
          Check payment again
        </button>
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

  const totals = orderTotals(lines);
  // The confirmation keeps its own copy: the cart is emptied as soon as the order succeeds
  const confirmed = confirmedOrder?.lines ?? [];

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
              <CheckoutForm
                onSubmit={handleSubmit}
                cardAvailable={cardAvailable}
                onPaymentMethodChange={setPaymentMethod}
              />
              <div className="self-start">
                {notices}
                <CheckoutSummary
                  items={lines}
                  {...totals}
                  busy={busy}
                  awaitingConfirmation={unconfirmed !== null}
                  chargeNotice={
                    paymentMethod === 'card'
                      ? `You’ll be charged ${formatNaira(toChargeKobo(totals.grandTotal))} by card.`
                      : undefined
                  }
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
        grandTotal={orderTotals(confirmed).grandTotal}
        chargedNaira={
          confirmedOrder?.chargedKobo ? formatNaira(confirmedOrder.chargedKobo) : undefined
        }
      />
    </>
  );
};

export default Checkout;
