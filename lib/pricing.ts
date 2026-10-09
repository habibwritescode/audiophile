// One source for order maths, used by the checkout page and by the server when charging, so the
// amount shown and the amount charged can't drift apart. Amounts are integer cents (USD).

export const SHIPPING_FEE_CENTS = 5000;
export const VAT_RATE = 0.2;

/**
 * Card payments are charged in naira: Paystack doesn't support USD on this account (see
 * SPEC-checkout-payments). A fixed demo rate keeps the conversion exact and predictable.
 */
export const NGN_PER_USD = 1600;

type PricedLine = { priceCents: number; quantity: number };

export const orderTotals = (lines: PricedLine[]) => {
  const total = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  return {
    total,
    shipping: SHIPPING_FEE_CENTS,
    // VAT is included in the prices (as the design shows), so it's informational only
    vat: Math.round(total * VAT_RATE),
    grandTotal: total + SHIPPING_FEE_CENTS,
  };
};

/** USD cents to NGN kobo: $1 (100 cents) = ₦NGN_PER_USD (NGN_PER_USD × 100 kobo) */
export const toChargeKobo = (cents: number) => cents * NGN_PER_USD;

export const formatNaira = (kobo: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(kobo / 100);
