import 'server-only';
import { randomUUID } from 'node:crypto';
import { CartCheckLine } from './cart-check';
import { CartCheckRequest, parseCartRequest } from './cart-validation';
import { CheckoutValues, initialCheckoutValues, validateCheckout } from './checkout-validation';
import {
  CashOrderResult,
  FulfilResult,
  createPendingCardOrder,
  fulfillCardPayment,
  placeCashOrder as placeCashOrderLogic,
  quoteOrder,
} from './orders';
import { toChargeKobo } from './pricing';
import { PaystackApiError, PaystackClient, PaystackConfigError, paystack } from './paystack';

// Integration tests tag their transactions, so they're easy to tell apart in the Paystack dashboard
const REFERENCE_PATTERN =
  /^audiophile-(?:test-)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const isPaymentReference = (value: unknown): value is string =>
  typeof value === 'string' && REFERENCE_PATTERN.test(value);

export class InvalidPaymentRequestError extends Error {}

export type StartCardPaymentResult =
  | { status: 'ready'; accessCode: string; reference: string; amountKobo: number }
  /** The cart or its total changed: apply these facts like any cart check, then pay again */
  | { status: 'cart-changed'; check: CartCheckLine[] }
  | { status: 'too-large' }
  | { status: 'unavailable' };

type CheckoutRequest = { lines: unknown; customer: unknown; displayedTotalCents: unknown };

/** The checkout form's fields, checked on the server with the same rules as the browser */
const parseCustomer = (input: unknown): CheckoutValues => {
  const raw = (input ?? {}) as Record<string, unknown>;
  const values = Object.fromEntries(
    (Object.keys(initialCheckoutValues) as (keyof CheckoutValues)[]).map((field) => {
      const value = raw[field];
      return [field, typeof value === 'string' && value.length <= 200 ? value.trim() : ''];
    })
  ) as CheckoutValues;
  if (Object.keys(validateCheckout(values)).length > 0) {
    throw new InvalidPaymentRequestError('Invalid customer details');
  }
  return values;
};

const parseCheckoutRequest = (input: CheckoutRequest) => {
  const lines: CartCheckRequest = parseCartRequest(input.lines);
  const customer = parseCustomer(input.customer);
  if (!Number.isInteger(input.displayedTotalCents)) {
    throw new InvalidPaymentRequestError('Invalid displayed total');
  }
  return { lines, customer, displayedTotalCents: input.displayedTotalCents as number };
};

/**
 * Creates the pending order and its Paystack transaction, charged in naira at the server's price.
 * Nothing is created unless every line is in stock and the total matches what the shopper was
 * shown (`displayedTotalCents`, compared only: the charge always comes from the database).
 */
export const startCardPayment = async (
  input: CheckoutRequest,
  client: PaystackClient = paystack,
  { testTransaction = false }: { testTransaction?: boolean } = {}
): Promise<StartCardPaymentResult> => {
  const { lines, customer, displayedTotalCents } = parseCheckoutRequest(input);

  const quote = await quoteOrder(lines);
  if (!quote.items || !quote.totals || quote.totals.grandTotal !== displayedTotalCents) {
    return { status: 'cart-changed', check: quote.check };
  }

  const amountKobo = toChargeKobo(quote.totals.grandTotal);
  const reference = `audiophile-${testTransaction ? 'test-' : ''}${randomUUID()}`;
  const orderId = randomUUID();

  let accessCode: string;
  try {
    ({ accessCode } = await client.initialize({
      email: customer.email,
      amount: amountKobo,
      currency: 'NGN',
      reference,
      metadata: { orderId, amountKobo, cart: lines },
    }));
  } catch (error) {
    if (error instanceof PaystackConfigError) return { status: 'unavailable' };
    if (error instanceof PaystackApiError) {
      // Paystack doesn't document its amount limit; this is how it rejects one
      if (/cannot be processed online/i.test(error.message)) return { status: 'too-large' };
      // Anything else is unexpected: log it (no personal data) so a change on Paystack's side shows
      console.error(`Paystack initialize failed (${error.httpStatus}): ${error.message}`);
    }
    throw error;
  }

  // Recorded only once Paystack has the transaction, so failed starts leave nothing behind. The
  // shopper can't pay before this returns, so the webhook always finds the order.
  await createPendingCardOrder({
    id: orderId,
    customer,
    quote: { ...quote, items: quote.items, totals: quote.totals },
    reference,
    amountKobo,
  });
  return { status: 'ready', accessCode, reference, amountKobo };
};

/**
 * Called by the browser after the popup reports success, and again by "Check payment again".
 * Fulfilment verifies the payment with Paystack and places the order at most once.
 */
export const confirmCardPayment = async (
  reference: unknown,
  client: PaystackClient = paystack
): Promise<FulfilResult> => {
  if (!isPaymentReference(reference)) {
    throw new InvalidPaymentRequestError('Invalid payment reference');
  }
  return fulfillCardPayment(reference, client);
};

export const placeCashOrder = async (input: CheckoutRequest): Promise<CashOrderResult> =>
  placeCashOrderLogic(parseCheckoutRequest(input));
