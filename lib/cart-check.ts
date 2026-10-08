import { formatAmount } from './helpers';

/** Most of one product a cart line can hold */
export const MAX_QUANTITY = 99;

/** Most distinct products a cart can hold; validateCart rejects anything longer */
export const MAX_CART_LINES = 20;

export type CartLine = {
  slug: string;
  shortName: string;
  cartImage: string;
  /** Price when added, refreshed by the server check */
  priceCents: number;
  quantity: number;
};

/** What the server knows about one product in the cart (see validateCart) */
export type CartCheckLine =
  | { slug: string; exists: false }
  | {
      slug: string;
      exists: true;
      available: number;
      priceCents: number;
      shortName: string;
      cartImage: string;
    };

/**
 * Applies the server's facts to the cart: lowers quantities to what's in stock, removes sold-out
 * and unknown products, refreshes prices and display fields. Returns one message per change the
 * shopper should know about.
 */
export const reconcileCart = (lines: CartLine[], check: CartCheckLine[]) => {
  const facts = new Map(check.map((line) => [line.slug, line]));
  const messages: string[] = [];
  const reconciled: CartLine[] = [];

  for (const line of lines) {
    const fact = facts.get(line.slug);

    if (!fact || !fact.exists) {
      messages.push(`${line.shortName}: no longer available, removed`);
      continue;
    }
    if (fact.available === 0) {
      messages.push(`${fact.shortName}: sold out, removed`);
      continue;
    }

    const quantity = Math.min(line.quantity, fact.available);
    if (quantity < line.quantity) {
      messages.push(`${fact.shortName}: only ${fact.available} left, quantity updated`);
    }
    if (fact.priceCents !== line.priceCents) {
      messages.push(`${fact.shortName}: price changed to ${formatAmount(fact.priceCents)}`);
    }

    const next = {
      slug: line.slug,
      shortName: fact.shortName,
      cartImage: fact.cartImage,
      priceCents: fact.priceCents,
      quantity,
    };
    const unchanged =
      next.shortName === line.shortName &&
      next.cartImage === line.cartImage &&
      next.priceCents === line.priceCents &&
      next.quantity === line.quantity;
    reconciled.push(unchanged ? line : next);
  }

  // Same array when nothing changed, so the store skips a save and a re-render
  const changed =
    reconciled.length !== lines.length || reconciled.some((line, i) => line !== lines[i]);
  return { lines: changed ? reconciled : lines, messages };
};

const isNonEmptyString = (value: unknown, maxLength = 200): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;

/**
 * Keeps only well-formed lines from a stored cart. localStorage is outside our control (older
 * builds, interrupted writes, hand edits), and a malformed line would break rendering or make every
 * server check fail. Quantities are clamped, duplicates merged, and the cart capped at
 * MAX_CART_LINES; anything else is dropped.
 */
export const sanitizeCartLines = (input: unknown): CartLine[] => {
  if (!Array.isArray(input)) return [];
  const lines: CartLine[] = [];

  for (const raw of input) {
    if (lines.length === MAX_CART_LINES) break;
    if (!raw || typeof raw !== 'object') continue;
    const { slug, shortName, cartImage, priceCents, quantity } = raw as Record<string, unknown>;
    if (
      !isNonEmptyString(slug, 100) ||
      !isNonEmptyString(shortName) ||
      !isNonEmptyString(cartImage) ||
      !cartImage.startsWith('/') ||
      !Number.isInteger(priceCents) ||
      (priceCents as number) <= 0 ||
      typeof quantity !== 'number' ||
      !Number.isFinite(quantity)
    ) {
      continue;
    }

    const clamped = Math.min(Math.trunc(quantity), MAX_QUANTITY);
    if (clamped < 1) continue;

    const existing = lines.find((line) => line.slug === slug);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + clamped, MAX_QUANTITY);
      continue;
    }
    lines.push({ slug, shortName, cartImage, priceCents: priceCents as number, quantity: clamped });
  }

  return lines;
};
