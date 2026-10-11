// @vitest-environment node
import { createHmac, randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as paystackWebhook } from '@/app/api/webhooks/paystack/route';
import { db } from './db';
import { OrderStatus } from './generated/prisma/enums';
import {
  createPendingCardOrder,
  fulfillCardPayment,
  formatOrderNumber,
  REFUND_CLAIM_STALE_MS,
  placeCashOrder,
  quoteOrder,
  recordRefundOutcome,
} from './orders';
import { PaystackClient } from './paystack';
import { orderTotals, toChargeKobo } from './pricing';

const hasDatabase = Boolean(process.env.DATABASE_URL);

// Test files share one database and run in parallel. Other files assert the seeded stock of most
// products, so these tests only touch XX99 Mark II ($2,999) and restore it afterwards.
const SLUG = 'xx99-mark-two-headphones';
const PRICE = 299900;
const SEEDED_STOCK = 10;

const customer = {
  name: 'Alexei Ward',
  email: 'alexei@mail.com',
  phone: '+1 202-555-0136',
  address: '1137 Williams Avenue',
  zip: '10001',
  city: 'New York',
  country: 'United States',
};

const setStock = (stock: number) => db.product.update({ where: { slug: SLUG }, data: { stock } });
const stock = async () => (await db.product.findUniqueOrThrow({ where: { slug: SLUG } })).stock;

let references = 0;
const newReference = () =>
  `audiophile-test-00000000-0000-4000-8000-${String(++references).padStart(12, '0')}`;

/** A pending card order as startCardPayment would create it */
const pendingOrder = async (quantity: number) => {
  const quote = await quoteOrder([{ slug: SLUG, quantity }]);
  if (!quote.items || !quote.totals) throw new Error('not enough stock for the test setup');
  const reference = newReference();
  const amountKobo = toChargeKobo(quote.totals.grandTotal);
  await createPendingCardOrder({
    id: randomUUID(),
    customer,
    quote: quote as Parameters<typeof createPendingCardOrder>[0]['quote'],
    reference,
    amountKobo,
  });
  return { reference, amountKobo };
};

const paystackPaying = (amountKobo: number, overrides = {}): PaystackClient => ({
  initialize: vi.fn(),
  verify: vi.fn(async (reference) => ({
    reference,
    status: 'success',
    amount: amountKobo,
    currency: 'NGN',
    metadata: {},
    ...overrides,
  })),
  refund: vi.fn(async () => ({ status: 'pending' })),
  hasRefund: vi.fn(async () => false),
});

describe.skipIf(!hasDatabase)('orders', () => {
  beforeEach(async () => {
    await setStock(SEEDED_STOCK);
  });

  afterEach(async () => {
    await db.order.deleteMany({ where: { items: { some: { product: { slug: SLUG } } } } });
    await setStock(SEEDED_STOCK);
  });

  describe('card payments', () => {
    it('places a pending order once paid, reducing stock', async () => {
      const { reference, amountKobo } = await pendingOrder(2);
      expect(await stock()).toBe(SEEDED_STOCK); // a pending order holds no stock

      const result = await fulfillCardPayment(reference, paystackPaying(amountKobo));

      expect(result.outcome).toBe('placed');
      if (result.outcome !== 'placed') return;
      expect(result.order).toMatchObject({
        number: expect.stringMatching(/^AUD-\d{6}$/),
        status: OrderStatus.PLACED,
        paymentMethod: 'CARD',
        grandTotalCents: orderTotals([{ priceCents: PRICE, quantity: 2 }]).grandTotal,
        chargedKobo: amountKobo,
        items: [{ slug: SLUG, shortName: 'XX99 MK II', priceCents: PRICE, quantity: 2 }],
      });
      expect(await stock()).toBe(SEEDED_STOCK - 2);
    });

    it('stores the customer, address and amounts on the order', async () => {
      const { reference, amountKobo } = await pendingOrder(1);
      await fulfillCardPayment(reference, paystackPaying(amountKobo));

      const order = await db.order.findUniqueOrThrow({ where: { paymentReference: reference } });
      expect(order).toMatchObject({
        customerName: customer.name,
        customerEmail: customer.email,
        address: customer.address,
        country: customer.country,
        subtotalCents: PRICE,
        shippingCents: 5000,
        grandTotalCents: PRICE + 5000,
      });
    });

    it('places the order only once however often it is confirmed', async () => {
      const { reference, amountKobo } = await pendingOrder(1);
      const client = paystackPaying(amountKobo);

      // The browser, a "Check payment again" and the webhook, all at once
      const results = await Promise.all([
        fulfillCardPayment(reference, client),
        fulfillCardPayment(reference, client),
        fulfillCardPayment(reference, client),
      ]);

      expect(results.map((result) => result.outcome)).toEqual(['placed', 'placed', 'placed']);
      expect(await stock()).toBe(SEEDED_STOCK - 1);
      expect(await db.order.count({ where: { paymentReference: reference } })).toBe(1);
      // Only the call that took the stock reports it, so pages are revalidated once
      const reported = results.flatMap((result) =>
        result.outcome === 'placed' && result.changedProducts.length > 0
          ? [result.changedProducts]
          : []
      );
      expect(reported).toEqual([[{ slug: SLUG, category: 'headphones' }]]);

      // ...and again later
      expect(await fulfillCardPayment(reference, client)).toMatchObject({
        outcome: 'placed',
        changedProducts: [],
      });
      expect(await stock()).toBe(SEEDED_STOCK - 1);
    });

    it('gives the last units to exactly one of two buyers and refunds the other', async () => {
      const first = await pendingOrder(2);
      const second = await pendingOrder(2);
      await setStock(2);
      const clients = [paystackPaying(first.amountKobo), paystackPaying(second.amountKobo)];

      const results = await Promise.all([
        fulfillCardPayment(first.reference, clients[0]),
        fulfillCardPayment(second.reference, clients[1]),
      ]);

      expect(results.map((result) => result.outcome).sort()).toEqual(['placed', 'refunding']);
      expect(await stock()).toBe(0);
      const refunded = results.findIndex((result) => result.outcome === 'refunding');
      expect(clients[refunded].refund).toHaveBeenCalledOnce();
      const order = await db.order.findUniqueOrThrow({
        where: { paymentReference: [first, second][refunded].reference },
      });
      expect(order).toMatchObject({
        status: OrderStatus.REFUND_PENDING,
        failureReason: 'out of stock after payment',
      });
    });

    it('refunds instead of placing when the charged amount does not match', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const { reference, amountKobo } = await pendingOrder(1);
      const client = paystackPaying(amountKobo - 100);

      const result = await fulfillCardPayment(reference, client);

      expect(result.outcome).toBe('refunding');
      expect(client.refund).toHaveBeenCalledWith(reference);
      expect(await stock()).toBe(SEEDED_STOCK);
    });

    it('requests a refund only once, even if asked again', async () => {
      const { reference, amountKobo } = await pendingOrder(2);
      await setStock(1);
      const client = paystackPaying(amountKobo);

      await fulfillCardPayment(reference, client);
      await fulfillCardPayment(reference, client);

      expect(client.refund).toHaveBeenCalledOnce();
    });

    it('leaves an unpaid order pending', async () => {
      const { reference, amountKobo } = await pendingOrder(1);

      const result = await fulfillCardPayment(
        reference,
        paystackPaying(amountKobo, { status: 'abandoned' })
      );

      expect(result).toEqual({ outcome: 'not-paid' });
      expect(await stock()).toBe(SEEDED_STOCK);
    });

    it('ignores references it has no order for', async () => {
      expect(await fulfillCardPayment(newReference(), paystackPaying(1))).toEqual({
        outcome: 'unknown',
      });
    });

    it('asks again for a refund Paystack did not accept, and records it once accepted', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const { reference, amountKobo } = await pendingOrder(2);
      await setStock(1);
      const client = paystackPaying(amountKobo);
      vi.mocked(client.refund).mockRejectedValueOnce(new Error('Paystack unavailable'));

      const first = await fulfillCardPayment(reference, client);
      expect(first).toMatchObject({ outcome: 'refunding', refundRequested: false });
      const unrequested = await db.order.findUniqueOrThrow({
        where: { paymentReference: reference },
      });
      expect(unrequested.refundRequestedAt).toBeNull();

      const second = await fulfillCardPayment(reference, client);
      expect(second).toMatchObject({ outcome: 'refunding', refundRequested: true });
      expect(client.refund).toHaveBeenCalledTimes(2);
      const requested = await db.order.findUniqueOrThrow({
        where: { paymentReference: reference },
      });
      expect(requested.refundRequestedAt).not.toBeNull();

      // Once accepted, it's never requested again
      await fulfillCardPayment(reference, client);
      expect(client.refund).toHaveBeenCalledTimes(2);
    });

    describe('a refund claim whose request never got an answer', () => {
      /** An order whose refund was claimed long ago (the server stopped before Paystack answered) */
      const staleClaim = async () => {
        const { reference, amountKobo } = await pendingOrder(2);
        await setStock(1);
        await fulfillCardPayment(reference, paystackPaying(amountKobo));
        await db.order.update({
          where: { paymentReference: reference },
          data: { refundRequestedAt: new Date(Date.now() - REFUND_CLAIM_STALE_MS - 60_000) },
        });
        return { reference, amountKobo };
      };

      it('asks again when Paystack has no refund on record', async () => {
        const { reference, amountKobo } = await staleClaim();
        const client = paystackPaying(amountKobo);

        await fulfillCardPayment(reference, client);

        expect(client.hasRefund).toHaveBeenCalledWith(reference);
        expect(client.refund).toHaveBeenCalledOnce();
        const order = await db.order.findUniqueOrThrow({ where: { paymentReference: reference } });
        expect(Date.now() - order.refundRequestedAt!.getTime()).toBeLessThan(60_000);
      });

      it('leaves it alone when Paystack already has the refund', async () => {
        const { reference, amountKobo } = await staleClaim();
        const client = paystackPaying(amountKobo);
        vi.mocked(client.hasRefund).mockResolvedValue(true);

        await fulfillCardPayment(reference, client);

        expect(client.refund).not.toHaveBeenCalled();
      });

      it('does not check Paystack while a claim is still recent', async () => {
        const { reference, amountKobo } = await pendingOrder(2);
        await setStock(1);
        await fulfillCardPayment(reference, paystackPaying(amountKobo));
        const client = paystackPaying(amountKobo);

        await fulfillCardPayment(reference, client);

        expect(client.hasRefund).not.toHaveBeenCalled();
        expect(client.refund).not.toHaveBeenCalled();
      });
    });

    it('flags a refund Paystack could not process, by order number', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { reference, amountKobo } = await pendingOrder(2);
      await setStock(0);
      await fulfillCardPayment(reference, paystackPaying(amountKobo));

      await recordRefundOutcome(reference, 'failed');

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringMatching(/^Refund FAILED for AUD-\d{6}: needs a manual refund$/)
      );
      expect(
        (await db.order.findUniqueOrThrow({ where: { paymentReference: reference } })).status
      ).toBe(OrderStatus.REFUND_FAILED);
    });

    it('records the outcome of a refund', async () => {
      const { reference, amountKobo } = await pendingOrder(2);
      await setStock(0);
      await fulfillCardPayment(reference, paystackPaying(amountKobo));

      await recordRefundOutcome(reference, 'processed');

      expect(
        (await db.order.findUniqueOrThrow({ where: { paymentReference: reference } })).status
      ).toBe(OrderStatus.REFUNDED);
    });
  });

  describe('cash on delivery', () => {
    const cashOrder = (quantity: number, displayedTotalCents?: number) =>
      placeCashOrder({
        lines: [{ slug: SLUG, quantity }],
        customer,
        displayedTotalCents:
          displayedTotalCents ?? orderTotals([{ priceCents: PRICE, quantity }]).grandTotal,
      });

    it('places the order and reduces stock together', async () => {
      const result = await cashOrder(3);

      expect(result.status).toBe('placed');
      if (result.status !== 'placed') return;
      expect(result.order).toMatchObject({
        status: 'PLACED',
        paymentMethod: 'CASH',
        chargedKobo: null,
      });
      expect(result.changedProducts).toEqual([{ slug: SLUG, category: 'headphones' }]);
      expect(await stock()).toBe(SEEDED_STOCK - 3);
    });

    it('creates nothing beyond the stock, and returns the facts to correct the cart', async () => {
      await setStock(1);

      const result = await cashOrder(2);

      expect(result).toMatchObject({
        status: 'cart-changed',
        check: [{ slug: SLUG, exists: true, available: 1 }],
      });
      expect(await stock()).toBe(1);
      expect(
        await db.order.count({ where: { items: { some: { product: { slug: SLUG } } } } })
      ).toBe(0);
    });

    it('creates nothing when the shopper saw a different total', async () => {
      const result = await cashOrder(1, PRICE);

      expect(result.status).toBe('cart-changed');
      expect(await stock()).toBe(SEEDED_STOCK);
    });

    it('never sells more than the stock when cash orders race', async () => {
      await setStock(3);

      const results = await Promise.all([cashOrder(2), cashOrder(2)]);

      expect(results.map((result) => result.status).sort()).toEqual(['cart-changed', 'placed']);
      expect(await stock()).toBe(1);
    });
  });

  describe('webhook, end to end', () => {
    const KEY = 'sk_test_orders_webhook';

    beforeEach(() => {
      vi.stubEnv('PAYSTACK_SECRET_KEY', KEY);
    });
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    });

    it('places the order from a signed charge.success, even with the tab closed', async () => {
      const { reference, amountKobo } = await pendingOrder(1);
      // The webhook re-verifies with Paystack: answer that verification here
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          Response.json({
            status: true,
            message: 'Verification successful',
            data: {
              reference,
              status: 'success',
              amount: amountKobo,
              currency: 'NGN',
              metadata: {},
            },
          })
        )
      );
      const body = JSON.stringify({ event: 'charge.success', data: { reference } });
      const signature = createHmac('sha512', KEY).update(body).digest('hex');

      const response = await paystackWebhook(
        new Request('http://localhost/api/webhooks/paystack', {
          method: 'POST',
          body,
          headers: { 'x-paystack-signature': signature },
        })
      );

      expect(response.status).toBe(200);
      expect(
        (await db.order.findUniqueOrThrow({ where: { paymentReference: reference } })).status
      ).toBe(OrderStatus.PLACED);
      expect(await stock()).toBe(SEEDED_STOCK - 1);
    });
  });

  it('formats order numbers for shoppers', () => {
    expect(formatOrderNumber(123)).toBe('AUD-000123');
  });
});

// Two temporary products, created for this test only, so it can lock them in both orders
describe.skipIf(!hasDatabase)('stock locking order', () => {
  const slugs = [`test-lock-a-${randomUUID()}`, `test-lock-b-${randomUUID()}`];

  const removeTestProducts = async (where: object) => {
    await db.order.deleteMany({ where: { items: { some: { product: where } } } });
    await db.product.deleteMany({ where });
  };

  beforeAll(async () => {
    // Leftovers from a run that aborted before its cleanup
    await removeTestProducts({ slug: { startsWith: 'test-lock-' } });
    const t = await db.product.findUniqueOrThrow({ where: { slug: SLUG } });
    for (const slug of slugs) {
      await db.product.create({
        data: {
          slug,
          stock: 1000,
          name: t.name,
          shortName: t.shortName,
          cardName: t.cardName,
          category: t.category,
          priceCents: t.priceCents,
          description: t.description,
          features: t.features,
          cartImage: t.cartImage,
          image: t.image ?? {},
          categoryImage: t.categoryImage ?? {},
          thumbnail: t.thumbnail ?? {},
          gallery: t.gallery ?? {},
          includes: t.includes ?? [],
        },
      });
    }
  });

  afterAll(async () => {
    await removeTestProducts({ slug: { in: slugs } });
  });

  it('never deadlocks when carts list the same products in opposite orders', async () => {
    const order = (first: string, second: string) =>
      placeCashOrder({
        lines: [
          { slug: first, quantity: 1 },
          { slug: second, quantity: 1 },
        ],
        customer,
        displayedTotalCents: orderTotals([
          { priceCents: PRICE, quantity: 1 },
          { priceCents: PRICE, quantity: 1 },
        ]).grandTotal,
      });

    // 8 rounds: with the lock-order sort removed, this caught the deadlock in 5 of 5 runs
    for (let round = 0; round < 8; round++) {
      const results = await Promise.all([
        order(slugs[0], slugs[1]),
        order(slugs[1], slugs[0]),
        order(slugs[0], slugs[1]),
        order(slugs[1], slugs[0]),
      ]);
      expect(results.every((result) => result.status === 'placed')).toBe(true);
    }
  });
});
