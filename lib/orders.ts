import 'server-only';
import { CartCheckLine, CartLine } from './cart-check';
import { CartCheckRequest } from './cart-validation';
import { CheckoutValues } from './checkout-validation';
import { db } from './db';
import { OrderStatus, PaymentMethod } from './generated/prisma/enums';
import { Prisma } from './generated/prisma/client';
import { orderTotals } from './pricing';
import { PaystackClient, paystack } from './paystack';

export type OrderCustomer = CheckoutValues;

/** What the browser gets back about an order: enough for the confirmation, nothing personal */
export type OrderSummary = {
  id: string;
  number: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  items: CartLine[];
  grandTotalCents: number;
  /** Card orders: the naira amount (kobo) charged */
  chargedKobo: number | null;
};

export const formatOrderNumber = (number: number) => `AUD-${String(number).padStart(6, '0')}`;

const orderWithItems = {
  items: { orderBy: { id: 'asc' }, include: { product: { select: { slug: true } } } },
} satisfies Prisma.OrderInclude;
type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderWithItems }>;

const toSummary = (order: OrderRow): OrderSummary => ({
  id: order.id,
  number: formatOrderNumber(order.number),
  status: order.status,
  paymentMethod: order.paymentMethod,
  items: order.items.map((item) => ({
    slug: item.product.slug,
    shortName: item.shortName,
    cartImage: item.cartImage,
    priceCents: item.unitPriceCents,
    quantity: item.quantity,
  })),
  grandTotalCents: order.grandTotalCents,
  chargedKobo: order.amountKobo,
});

/**
 * Prices a cart from the database in one query. `check` has the same facts as a cart check, so
 * the browser can apply corrections; `items` and `totals` are only present when every line can
 * be fulfilled right now.
 */
export const quoteOrder = async (lines: CartCheckRequest) => {
  const products = await db.product.findMany({
    where: { slug: { in: lines.map((line) => line.slug) } },
    select: {
      id: true,
      slug: true,
      stock: true,
      priceCents: true,
      shortName: true,
      cartImage: true,
    },
  });
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const check: CartCheckLine[] = lines.map(({ slug }) => {
    const product = bySlug.get(slug);
    if (!product) return { slug, exists: false };
    const { stock, priceCents, shortName, cartImage } = product;
    return { slug, exists: true, available: stock, priceCents, shortName, cartImage };
  });

  const fulfillable = lines.every(
    ({ slug, quantity }) => (bySlug.get(slug)?.stock ?? 0) >= quantity
  );
  if (!fulfillable) return { check, items: null, totals: null };

  const items = lines.map(({ slug, quantity }) => {
    const product = bySlug.get(slug)!;
    return {
      productId: product.id,
      shortName: product.shortName,
      cartImage: product.cartImage,
      unitPriceCents: product.priceCents,
      quantity,
    };
  });
  const totals = orderTotals(
    items.map((item) => ({ priceCents: item.unitPriceCents, quantity: item.quantity }))
  );
  return { check, items, totals };
};

type Quote = Awaited<ReturnType<typeof quoteOrder>>;
export type PricedQuote = Quote & {
  items: NonNullable<Quote['items']>;
  totals: NonNullable<Quote['totals']>;
};

const orderData = (customer: OrderCustomer, quote: PricedQuote) => ({
  customerName: customer.name,
  customerEmail: customer.email,
  customerPhone: customer.phone,
  address: customer.address,
  zip: customer.zip,
  city: customer.city,
  country: customer.country,
  subtotalCents: quote.totals.total,
  shippingCents: quote.totals.shipping,
  vatCents: quote.totals.vat,
  grandTotalCents: quote.totals.grandTotal,
  items: { create: quote.items },
});

class OutOfStockError extends Error {}

/**
 * Reduces stock for every item, inside the caller's transaction. Each decrement only happens if
 * enough stock remains at that moment (the row lock makes concurrent orders queue up), so two
 * shoppers can never both get the last unit. Any shortfall throws, rolling the transaction back.
 * Rows are always locked in product-id order: two carts listing the same products in opposite
 * orders would otherwise each hold one row and wait for the other (a deadlock).
 */
const takeStock = async (
  tx: Prisma.TransactionClient,
  items: { productId: number; quantity: number }[]
) => {
  const ordered = [...items].sort((a, b) => a.productId - b.productId);
  for (const { productId, quantity } of ordered) {
    const taken = await tx.$executeRaw`
      UPDATE "Product" SET "stock" = "stock" - ${quantity}
      WHERE "id" = ${productId} AND "stock" >= ${quantity}`;
    if (taken === 0) throw new OutOfStockError(`Product ${productId} is out of stock`);
  }
};

/**
 * Card: records the order once Paystack has accepted the transaction, holding no stock, so the
 * webhook can find it when the payment arrives. The id is chosen by the caller because it's also
 * sent to Paystack in the transaction's metadata.
 */
export const createPendingCardOrder = async ({
  id,
  customer,
  quote,
  reference,
  amountKobo,
}: {
  id: string;
  customer: OrderCustomer;
  quote: PricedQuote;
  reference: string;
  amountKobo: number;
}) =>
  db.order.create({
    data: {
      id,
      ...orderData(customer, quote),
      status: OrderStatus.PENDING_PAYMENT,
      paymentMethod: PaymentMethod.CARD,
      paymentReference: reference,
      amountKobo,
    },
    select: { id: true, number: true },
  });

export type FulfilResult =
  /** The order is placed (now, or by an earlier call) */
  | { outcome: 'placed'; order: OrderSummary }
  /**
   * Charged but couldn't be fulfilled. `refundRequested` is false while Paystack hasn't accepted
   * the refund request yet: callers that can retry (the webhook) should treat that as a failure.
   */
  | { outcome: 'refunding'; order: OrderSummary; refundRequested: boolean }
  /** Paystack doesn't report a successful payment (yet) */
  | { outcome: 'not-paid' }
  /** No order for this reference (e.g. a payment made against another environment) */
  | { outcome: 'unknown' };

const resultFor = (order: OrderRow): FulfilResult => {
  if (order.status === OrderStatus.PLACED) return { outcome: 'placed', order: toSummary(order) };
  if (order.status === OrderStatus.PENDING_PAYMENT) return { outcome: 'not-paid' };
  return {
    outcome: 'refunding',
    order: toSummary(order),
    refundRequested:
      order.status !== OrderStatus.REFUND_PENDING || order.refundRequestedAt !== null,
  };
};

const findByReference = (reference: string) =>
  db.order.findUnique({ where: { paymentReference: reference }, include: orderWithItems });

/**
 * A refund claim older than this, without a refund on Paystack's side, was abandoned: the server
 * stopped (timeout, crash, deploy) between claiming it and hearing back from Paystack.
 */
export const REFUND_CLAIM_STALE_MS = 5 * 60 * 1000;

/**
 * Asks Paystack to refund a REFUND_PENDING order, at most once at a time: the request is claimed
 * by setting refundRequestedAt first, and released again if Paystack doesn't accept it, so the
 * next fulfilment attempt (browser re-check, webhook retry) asks again. `claimedBefore` re-takes
 * a stale claim instead of only an empty one.
 */
const requestRefund = async (order: OrderRow, client: PaystackClient, claimedBefore?: Date) => {
  const claimed = await db.order.updateMany({
    where: {
      id: order.id,
      status: OrderStatus.REFUND_PENDING,
      refundRequestedAt: claimedBefore ? { lt: claimedBefore } : null,
    },
    data: { refundRequestedAt: new Date() },
  });
  if (claimed.count === 0) return; // already requested, or another caller is requesting it now

  try {
    await client.refund(order.paymentReference!);
  } catch (error) {
    await db.order.update({ where: { id: order.id }, data: { refundRequestedAt: null } });
    console.error(
      `Refund request failed for ${formatOrderNumber(order.number)}, will retry: ${(error as Error).message}`
    );
  }
};

/** Moves a pending order into refund (with the reason) and asks Paystack for the money back */
const refundPendingOrder = async (order: OrderRow, reason: string, client: PaystackClient) => {
  await db.order.updateMany({
    where: { id: order.id, status: OrderStatus.PENDING_PAYMENT },
    data: { status: OrderStatus.REFUND_PENDING, failureReason: reason },
  });
  const current = (await findByReference(order.paymentReference!))!;
  if (current.status === OrderStatus.REFUND_PENDING) await requestRefund(current, client);
  return resultFor((await findByReference(order.paymentReference!))!);
};

/**
 * Turns a verified card payment into a placed order. Safe to call any number of times, from the
 * browser and from Paystack's webhook: only the first call that finds the order pending places it,
 * and a refund that Paystack hasn't accepted yet is requested again.
 */
export const fulfillCardPayment = async (
  reference: string,
  client: PaystackClient = paystack
): Promise<FulfilResult> => {
  const order = await findByReference(reference);
  if (!order) return { outcome: 'unknown' };

  if (order.status === OrderStatus.REFUND_PENDING) {
    if (order.refundRequestedAt === null) {
      await requestRefund(order, client);
    } else if (Date.now() - order.refundRequestedAt.getTime() > REFUND_CLAIM_STALE_MS) {
      // An old claim proves nothing on its own: trust Paystack's record, and ask again if it has
      // no refund (the claim was abandoned before Paystack got the request)
      if (!(await client.hasRefund(reference))) {
        await requestRefund(order, client, new Date(Date.now() - REFUND_CLAIM_STALE_MS));
      }
    }
    return resultFor((await findByReference(reference))!);
  }
  if (order.status !== OrderStatus.PENDING_PAYMENT) return resultFor(order);

  const transaction = await client.verify(reference);
  if (transaction.status !== 'success') return { outcome: 'not-paid' };

  if (transaction.currency !== 'NGN' || transaction.amount !== order.amountKobo) {
    console.error(
      `Payment for ${formatOrderNumber(order.number)} succeeded with an unexpected amount or currency`
    );
    return refundPendingOrder(order, 'charged amount or currency did not match the order', client);
  }

  try {
    await db.$transaction(async (tx) => {
      // Claim the order first: a concurrent fulfilment (browser + webhook) finds nothing to change
      const claimed = await tx.order.updateMany({
        where: { id: order.id, status: OrderStatus.PENDING_PAYMENT },
        data: { status: OrderStatus.PLACED, placedAt: new Date() },
      });
      if (claimed.count === 0) return;
      await takeStock(tx, order.items);
    });
  } catch (error) {
    if (!(error instanceof OutOfStockError)) throw error;
    return refundPendingOrder(order, 'out of stock after payment', client);
  }

  return resultFor((await findByReference(reference))!);
};

export type CashOrderResult =
  | { status: 'placed'; order: OrderSummary }
  /** Stock or prices changed: nothing was created; apply these facts like any cart check */
  | { status: 'cart-changed'; check: CartCheckLine[] };

/** Cash on Delivery: the order and its stock change happen together, or not at all */
export const placeCashOrder = async ({
  lines,
  customer,
  displayedTotalCents,
}: {
  lines: CartCheckRequest;
  customer: OrderCustomer;
  displayedTotalCents: number;
}): Promise<CashOrderResult> => {
  const quote = await quoteOrder(lines);
  if (!quote.items || !quote.totals || quote.totals.grandTotal !== displayedTotalCents) {
    return { status: 'cart-changed', check: quote.check };
  }
  const priced = { ...quote, items: quote.items, totals: quote.totals };

  try {
    const created = await db.$transaction(async (tx) => {
      await takeStock(tx, priced.items);
      return tx.order.create({
        data: {
          ...orderData(customer, priced),
          status: OrderStatus.PLACED,
          paymentMethod: PaymentMethod.CASH,
          placedAt: new Date(),
        },
        include: orderWithItems,
      });
    });
    return { status: 'placed', order: toSummary(created) };
  } catch (error) {
    if (!(error instanceof OutOfStockError)) throw error;
    // Sold out between the quote and the transaction: report the new facts
    return { status: 'cart-changed', check: (await quoteOrder(lines)).check };
  }
};

/** Paystack's refund.* webhooks: record the outcome of a refund we requested */
export const recordRefundOutcome = async (reference: string, outcome: 'processed' | 'failed') => {
  const updated = await db.order.updateMany({
    where: { paymentReference: reference, status: OrderStatus.REFUND_PENDING },
    data: { status: outcome === 'processed' ? OrderStatus.REFUNDED : OrderStatus.REFUND_FAILED },
  });
  if (outcome === 'failed' && updated.count > 0) {
    // Paystack returned the money to our balance; the customer still has to be paid by a person
    const order = await db.order.findUnique({
      where: { paymentReference: reference },
      select: { number: true },
    });
    console.error(
      `Refund FAILED for ${order ? formatOrderNumber(order.number) : reference}: needs a manual refund`
    );
  }
  return updated;
};
