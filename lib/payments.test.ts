// @vitest-environment node
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { db } from './db';
import {
  InvalidPaymentRequestError,
  confirmCardPayment,
  placeCashOrder,
  startCardPayment,
} from './payments';
import {
  isCardPaymentConfigured,
  PAYSTACK_TIMEOUT_MS,
  PaystackApiError,
  PaystackClient,
  PaystackConfigError,
  paystack,
} from './paystack';
import { orderTotals, toChargeKobo } from './pricing';

const hasDatabase = Boolean(process.env.DATABASE_URL);
const hasPaystackTestKey = process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_') ?? false;

const customer = {
  name: 'Alexei Ward',
  email: 'alexei@mail.com',
  phone: '+1 202-555-0136',
  address: '1137 Williams Avenue',
  zip: '10001',
  city: 'New York',
  country: 'United States',
};
const REFERENCE = 'audiophile-123e4567-e89b-42d3-a456-426614174000';

// Seeded: ZX9 Speaker $4,500, stock 10. Card orders here stay pending, so stock never changes
// (other test files assert seeded stock; placing orders is covered by orders.test.ts).
const zx9Order = { lines: [{ slug: 'zx9-speaker', quantity: 2 }], customer };
const zx9Total = orderTotals([{ priceCents: 450000, quantity: 2 }]).grandTotal;
const TAGGED = { testTransaction: true };

const fakeClient = (overrides: Partial<PaystackClient> = {}): PaystackClient => ({
  initialize: vi.fn<PaystackClient['initialize']>(async ({ reference }) => ({
    accessCode: 'access-code',
    reference,
  })),
  verify: vi.fn<PaystackClient['verify']>(),
  refund: vi.fn<PaystackClient['refund']>(async () => ({ status: 'pending' })),
  hasRefund: vi.fn<PaystackClient['hasRefund']>(async () => false),
  ...overrides,
});

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(async () => {
  if (hasDatabase) {
    await db.order.deleteMany({
      where: { paymentReference: { startsWith: 'audiophile-test-' }, status: 'PENDING_PAYMENT' },
    });
  }
});

describe('startCardPayment input', () => {
  it.each([
    ['a malformed cart', { ...zx9Order, lines: 'nope' }],
    ['a bad email', { ...zx9Order, customer: { ...customer, email: 'alexei@mail' } }],
    ['a missing address', { ...zx9Order, customer: { ...customer, address: ' ' } }],
    ['a missing name', { ...zx9Order, customer: { ...customer, name: undefined } }],
  ])('rejects %s before doing anything', async (_, input) => {
    const client = fakeClient();

    // InvalidCartError for the cart, InvalidPaymentRequestError for the customer
    await expect(
      startCardPayment({ ...input, displayedTotalCents: zx9Total }, client, TAGGED)
    ).rejects.toThrow(/Invalid|Cart must be a list/);
    expect(client.initialize).not.toHaveBeenCalled();
  });

  it('rejects a fractional displayed total', async () => {
    await expect(
      startCardPayment({ ...zx9Order, displayedTotalCents: 1.5 }, fakeClient(), TAGGED)
    ).rejects.toThrow(InvalidPaymentRequestError);
  });
});

describe.skipIf(!hasDatabase)('startCardPayment', () => {
  it('creates a pending order, then a naira transaction for the database total', async () => {
    const client = fakeClient();

    const result = await startCardPayment(
      { ...zx9Order, displayedTotalCents: zx9Total },
      client,
      TAGGED
    );

    const amountKobo = toChargeKobo(zx9Total);
    expect(result).toMatchObject({ status: 'ready', accessCode: 'access-code', amountKobo });
    if (result.status !== 'ready') return;
    const params = vi.mocked(client.initialize).mock.calls[0][0];
    expect(params).toMatchObject({ email: customer.email, amount: amountKobo, currency: 'NGN' });
    expect(params.reference).toMatch(/^audiophile-test-[0-9a-f-]{36}$/);

    const order = await db.order.findUniqueOrThrow({
      where: { paymentReference: result.reference },
      include: { items: true },
    });
    expect(order).toMatchObject({
      status: 'PENDING_PAYMENT',
      paymentMethod: 'CARD',
      amountKobo,
      grandTotalCents: zx9Total,
      customerEmail: customer.email,
      address: customer.address,
    });
    expect(order.items).toMatchObject([{ shortName: 'ZX9', unitPriceCents: 450000, quantity: 2 }]);
    expect(params.metadata).toEqual({ orderId: order.id, amountKobo, cart: zx9Order.lines });
  });

  it('accepts a long address the form accepts', async () => {
    // A real Lagos address with landmark directions: 215 characters
    const address =
      'Flat 4B, Block 12, Sunshine Gardens Estate, Off Admiralty Way, Opposite Mega Plaza, Beside First Bank, Lekki Phase 1, Eti-Osa Local Government Area, Lagos State. Landmark: big yellow gate after the second roundabout';

    const result = await startCardPayment(
      { ...zx9Order, customer: { ...customer, address }, displayedTotalCents: zx9Total },
      fakeClient(),
      TAGGED
    );

    expect(result.status).toBe('ready');
  });

  it('creates nothing when the cart asks for more than is in stock', async () => {
    const client = fakeClient();

    const result = await startCardPayment(
      {
        lines: [{ slug: 'xx59-headphones', quantity: 5 }],
        customer,
        displayedTotalCents: 454500,
      },
      client,
      TAGGED
    );

    expect(result.status).toBe('cart-changed');
    expect(client.initialize).not.toHaveBeenCalled();
  });

  it('creates nothing when the shopper was shown a different total', async () => {
    const client = fakeClient();

    const result = await startCardPayment(
      { ...zx9Order, displayedTotalCents: zx9Total - 100 },
      client,
      TAGGED
    );

    expect(result.status).toBe('cart-changed');
    expect(client.initialize).not.toHaveBeenCalled();
  });

  it('merges a product listed twice before checking stock', async () => {
    const client = fakeClient();

    // XX59 has 2 in stock: two lines of 2 must not pass as two separate checks
    const result = await startCardPayment(
      {
        lines: [
          { slug: 'xx59-headphones', quantity: 2 },
          { slug: 'xx59-headphones', quantity: 2 },
        ],
        customer,
        displayedTotalCents: 364600,
      },
      client,
      TAGGED
    );

    expect(result.status).toBe('cart-changed');
    expect(client.initialize).not.toHaveBeenCalled();
  });

  it('reports an order too large to pay online', async () => {
    const client = fakeClient({
      initialize: vi.fn(async () => {
        throw new PaystackApiError('Watch your spending. Amount cannot be processed online', 400);
      }),
    });

    expect(
      await startCardPayment({ ...zx9Order, displayedTotalCents: zx9Total }, client, TAGGED)
    ).toEqual({ status: 'too-large' });

    // Paystack refused the transaction, so no order was recorded for it
    const { reference } = vi.mocked(client.initialize).mock.calls[0][0];
    expect(await db.order.findUnique({ where: { paymentReference: reference } })).toBeNull();
  });

  it('reports card payments as unavailable without a usable key', async () => {
    const client = fakeClient({
      initialize: vi.fn(async () => {
        throw new PaystackConfigError('PAYSTACK_SECRET_KEY is not set');
      }),
    });

    expect(
      await startCardPayment({ ...zx9Order, displayedTotalCents: zx9Total }, client, TAGGED)
    ).toEqual({ status: 'unavailable' });
  });

  it('logs unexpected Paystack errors without personal data, and rethrows them', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const client = fakeClient({
      initialize: vi.fn(async () => {
        throw new PaystackApiError('Invalid key', 401);
      }),
    });

    await expect(
      startCardPayment({ ...zx9Order, displayedTotalCents: zx9Total }, client, TAGGED)
    ).rejects.toThrow('Invalid key');
    expect(consoleError).toHaveBeenCalledWith('Paystack initialize failed (401): Invalid key');
    const { reference } = vi.mocked(client.initialize).mock.calls[0][0];
    expect(await db.order.findUnique({ where: { paymentReference: reference } })).toBeNull();
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(customer.email);
  });
});

describe('confirmCardPayment', () => {
  it.each([
    ['not a string', 42],
    ['a foreign reference', 'T123456789'],
    ['path tricks', 'audiophile-../../x'],
  ])('rejects a reference that is %s without calling Paystack', async (_, reference) => {
    const client = fakeClient();

    await expect(confirmCardPayment(reference, client)).rejects.toThrow(InvalidPaymentRequestError);
    expect(client.verify).not.toHaveBeenCalled();
  });

  it.skipIf(!hasDatabase)('reports an unknown reference without calling Paystack', async () => {
    const client = fakeClient();

    expect(await confirmCardPayment(REFERENCE, client)).toEqual({ outcome: 'unknown' });
    expect(client.verify).not.toHaveBeenCalled();
  });

  it.skipIf(!hasDatabase)('leaves the order pending until Paystack reports success', async () => {
    const started = await startCardPayment(
      { ...zx9Order, displayedTotalCents: zx9Total },
      fakeClient(),
      TAGGED
    );
    if (started.status !== 'ready') throw new Error('setup failed');
    const client = fakeClient({
      verify: vi.fn(async (reference) => ({
        reference,
        status: 'abandoned',
        amount: started.amountKobo,
        currency: 'NGN',
        metadata: {},
      })),
    });

    expect(await confirmCardPayment(started.reference, client)).toEqual({ outcome: 'not-paid' });
  });
});

describe('placeCashOrder input', () => {
  it('validates the customer before touching the database', async () => {
    await expect(
      placeCashOrder({
        ...zx9Order,
        customer: { ...customer, zip: '12' },
        displayedTotalCents: zx9Total,
      })
    ).rejects.toThrow(InvalidPaymentRequestError);
  });
});

describe('Paystack timeouts', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('gives up on a request that hangs', async () => {
    vi.useFakeTimers();
    vi.stubEnv('PAYSTACK_SECRET_KEY', 'sk_test_timeout');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) =>
            init.signal!.addEventListener('abort', () => reject(new Error('aborted')))
          )
      )
    );

    const verification = paystack.verify(REFERENCE);
    const assertion = expect(verification).rejects.toThrow('Paystack request timed out');
    await vi.advanceTimersByTimeAsync(PAYSTACK_TIMEOUT_MS);

    await assertion;
  });
});

describe('Paystack key guard', () => {
  it('refuses live keys and missing keys', async () => {
    vi.stubEnv('PAYSTACK_SECRET_KEY', 'sk_live_not_allowed');
    expect(isCardPaymentConfigured()).toBe(false);
    await expect(paystack.verify(REFERENCE)).rejects.toThrow(PaystackConfigError);

    vi.stubEnv('PAYSTACK_SECRET_KEY', '');
    expect(isCardPaymentConfigured()).toBe(false);
  });
});

describe.skipIf(!hasDatabase || !hasPaystackTestKey)('Paystack test mode (real API)', () => {
  it('creates a real test transaction whose order stays pending until paid', async () => {
    const result = await startCardPayment(
      { ...zx9Order, displayedTotalCents: zx9Total },
      paystack,
      TAGGED
    );

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.accessCode).toBeTruthy();
    expect(await confirmCardPayment(result.reference)).toEqual({ outcome: 'not-paid' });
  });
});
