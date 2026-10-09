'use server';

import { checkCart } from '@/lib/cart-validation';
import {
  confirmCardPayment as confirmCardPaymentLogic,
  startCardPayment as startCardPaymentLogic,
} from '@/lib/payments';

// Public endpoint: checkCart validates the input and only reads from the database
export const validateCart = async (lines: unknown) => checkCart(lines);

// Public endpoints: both validate their input; startCardPayment creates at most one Paystack
// transaction per call, and only for a cart that passes the stock and total checks
export const startCardPayment = async (input: {
  lines: unknown;
  customer: unknown;
  displayedTotalCents: unknown;
}) => startCardPaymentLogic(input);

export const confirmCardPayment = async (reference: unknown) => confirmCardPaymentLogic(reference);
