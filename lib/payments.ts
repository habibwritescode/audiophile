import 'server-only';
import { randomUUID } from 'node:crypto';
import { CartCheckLine } from './cart-check';
import { checkCart, parseCartRequest } from './cart-validation';
import { isValidEmail } from './checkout-validation';
import { orderTotals, toChargeKobo } from './pricing';
import { PaystackApiError, PaystackClient, PaystackConfigError, paystack } from './paystack';

// Integration tests tag their transactions, so they're easy to tell apart in the Paystack dashboard
const REFERENCE_PATTERN =
  /^audiophile-(?:test-)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class InvalidPaymentRequestError extends Error {}

export type StartCardPaymentResult =
  | { status: 'ready'; accessCode: string; reference: string; amountKobo: number }
  /** The cart or its total changed: apply these facts like any cart check, then pay again */
  | { status: 'cart-changed'; check: CartCheckLine[] }
  | { status: 'too-large' }
  | { status: 'unavailable' };

const parseCustomer = (input: unknown) => {
  const { name, email, phone } = (input ?? {}) as Record<string, unknown>;
  const text = (value: unknown) =>
    typeof value === 'string' && value.trim() && value.length <= 200 ? value.trim() : null;
  const customer = { name: text(name), email: text(email), phone: text(phone) };
  if (!customer.name || !customer.phone || !customer.email || !isValidEmail(customer.email)) {
    throw new InvalidPaymentRequestError('Invalid customer details');
  }
  return customer as { name: string; email: string; phone: string };
};

/**
 * Creates a Paystack transaction for the cart, charged in naira at the server's price. Nothing is
 * created unless the cart passes the stock check and its total matches what the shopper was shown
 * (`displayedTotalCents`, compared only: the charge always comes from the database).
 */
export const startCardPayment = async (
  input: { lines: unknown; customer: unknown; displayedTotalCents: unknown },
  client: PaystackClient = paystack,
  { testTransaction = false }: { testTransaction?: boolean } = {}
): Promise<StartCardPaymentResult> => {
  const lines = parseCartRequest(input.lines);
  const customer = parseCustomer(input.customer);
  if (!Number.isInteger(input.displayedTotalCents)) {
    throw new InvalidPaymentRequestError('Invalid displayed total');
  }

  const check = await checkCart(lines);
  const facts = new Map(check.map((fact) => [fact.slug, fact]));
  const priced = lines.map((line) => {
    const fact = facts.get(line.slug);
    return fact?.exists && fact.available >= line.quantity
      ? { priceCents: fact.priceCents, quantity: line.quantity }
      : null;
  });
  const { grandTotal } = orderTotals(priced.filter((line) => line !== null));
  if (priced.includes(null) || grandTotal !== input.displayedTotalCents) {
    return { status: 'cart-changed', check };
  }

  const amountKobo = toChargeKobo(grandTotal);
  const reference = `audiophile-${testTransaction ? 'test-' : ''}${randomUUID()}`;
  try {
    const { accessCode } = await client.initialize({
      email: customer.email,
      amount: amountKobo,
      currency: 'NGN',
      reference,
      // Set by the server, so verification can trust it; `orders` will read the cart from here
      metadata: {
        amountKobo,
        amountCents: grandTotal,
        cart: lines,
        customer: { name: customer.name, phone: customer.phone },
      },
    });
    return { status: 'ready', accessCode, reference, amountKobo };
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
};

const expectedKobo = (metadata: unknown) => {
  try {
    const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    return (parsed as { amountKobo?: unknown } | null)?.amountKobo;
  } catch {
    return undefined; // Unreadable metadata can't prove the amount: treated as not paid, and logged
  }
};

/**
 * The popup's success callback is not proof of payment: ask Paystack, and accept only a successful
 * NGN charge for exactly the amount this server set when it created the transaction.
 */
export const confirmCardPayment = async (
  reference: unknown,
  client: PaystackClient = paystack
): Promise<{ paid: boolean }> => {
  if (typeof reference !== 'string' || !REFERENCE_PATTERN.test(reference)) {
    throw new InvalidPaymentRequestError('Invalid payment reference');
  }

  const transaction = await client.verify(reference);
  const paid =
    transaction.status === 'success' &&
    transaction.currency === 'NGN' &&
    Number.isInteger(transaction.amount) &&
    transaction.amount === expectedKobo(transaction.metadata);

  if (transaction.status === 'success' && !paid) {
    // Charged, but not what we asked for: needs a human (refunds are part of `orders`)
    console.error(`Payment ${reference} succeeded with an unexpected amount or currency`);
  }
  return { paid };
};
