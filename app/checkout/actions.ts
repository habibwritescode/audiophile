'use server';

import { headers } from 'next/headers';
import { checkCart } from '@/lib/cart-validation';
import {
  confirmCardPayment as confirmCardPaymentLogic,
  placeCashOrder as placeCashOrderLogic,
  startCardPayment as startCardPaymentLogic,
} from '@/lib/payments';
import { revalidateProductPages } from '@/lib/product-pages';
import { PAYMENT_ATTEMPTS, takeRateLimit } from '@/lib/rate-limit';

type CheckoutRequest = { lines: unknown; customer: unknown; displayedTotalCents: unknown };

/**
 * The visitor's IP. Vercel sets x-real-ip (and overwrites x-forwarded-for) itself, so on Vercel
 * these can't be spoofed by the client. Behind any other host, check how it sets them: a client
 * that controls these headers can dodge the rate limit.
 */
const clientIp = async () => {
  const requestHeaders = await headers();
  return (
    requestHeaders.get('x-real-ip')?.trim() ||
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
};

/** Shared by both ways to place an order: each attempt can create records and a transaction */
const withinPaymentLimit = async () =>
  takeRateLimit(`payment-attempt:${await clientIp()}`, PAYMENT_ATTEMPTS);

// Public endpoint: checkCart validates the input and only reads from the database
export const validateCart = async (lines: unknown) => checkCart(lines);

// Public endpoints: both validate their input and are rate-limited per IP. startCardPayment creates
// at most one pending order and Paystack transaction per call, only for a cart that passes the
// stock and total checks; placeCashOrder creates the order and reduces stock together
export const startCardPayment = async (input: CheckoutRequest) =>
  (await withinPaymentLimit())
    ? startCardPaymentLogic(input)
    : ({ status: 'rate-limited' } as const);

export const placeCashOrder = async (input: CheckoutRequest) => {
  if (!(await withinPaymentLimit())) return { status: 'rate-limited' } as const;
  const result = await placeCashOrderLogic(input);
  if (result.status !== 'placed') return result;
  const { changedProducts, ...placed } = result;
  revalidateProductPages(changedProducts);
  return placed;
};

// Not limited: it creates nothing, and shoppers must always be able to confirm a payment
export const confirmCardPayment = async (reference: unknown) => {
  const result = await confirmCardPaymentLogic(reference);
  if (result.outcome !== 'placed') return result;
  const { changedProducts, ...placed } = result;
  revalidateProductPages(changedProducts);
  return placed;
};
