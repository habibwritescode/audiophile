// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InvalidPaymentRequestError, confirmCardPayment, startCardPayment } from './payments';
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

const customer = { name: 'Alexei Ward', email: 'alexei@mail.com', phone: '+1 202-555-0136' };
const REFERENCE = 'audiophile-123e4567-e89b-42d3-a456-426614174000';

// Seeded: ZX9 Speaker $4,500, stock 10; ZX7 Speaker $3,500, stock 10
const zx9Order = { lines: [{ slug: 'zx9-speaker', quantity: 2 }], customer };
const zx9Total = orderTotals([{ priceCents: 450000, quantity: 2 }]).grandTotal;

const fakeClient = (overrides: Partial<PaystackClient> = {}) => ({
  initialize: vi.fn<PaystackClient['initialize']>(async ({ reference }) => ({
    accessCode: 'access-code',
    reference,
  })),
  verify: vi.fn<PaystackClient['verify']>(),
  ...overrides,
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('startCardPayment input', () => {
  it.each([
    ['a malformed cart', { ...zx9Order, lines: 'nope', displayedTotalCents: zx9Total }],
    [
      'a bad email',
      {
        ...zx9Order,
        customer: { ...customer, email: 'alexei@mail' },
        displayedTotalCents: zx9Total,
      },
    ],
    [
      'a missing name',
      { ...zx9Order, customer: { ...customer, name: ' ' }, displayedTotalCents: zx9Total },
    ],
    ['a fractional displayed total', { ...zx9Order, displayedTotalCents: 1.5 }],
  ])('rejects %s before doing anything', async (_, input) => {
    const client = fakeClient();

    await expect(startCardPayment(input, client)).rejects.toThrow();
    expect(client.initialize).not.toHaveBeenCalled();
  });
});

describe.skipIf(!hasDatabase)('startCardPayment', () => {
  it('creates a naira transaction for the database total', async () => {
    const client = fakeClient();

    const result = await startCardPayment({ ...zx9Order, displayedTotalCents: zx9Total }, client);

    const amountKobo = toChargeKobo(zx9Total);
    expect(result).toMatchObject({ status: 'ready', accessCode: 'access-code', amountKobo });
    expect(client.initialize).toHaveBeenCalledOnce();
    const params = vi.mocked(client.initialize).mock.calls[0][0];
    expect(params).toMatchObject({ email: customer.email, amount: amountKobo, currency: 'NGN' });
    expect(params.reference).toMatch(/^audiophile-[0-9a-f-]{36}$/);
    expect(params.metadata).toEqual({
      amountKobo,
      amountCents: zx9Total,
      cart: zx9Order.lines,
      customer: { name: customer.name, phone: customer.phone },
    });
  });

  it('creates nothing when the cart asks for more than is in stock', async () => {
    const client = fakeClient();

    const result = await startCardPayment(
      { lines: [{ slug: 'xx59-headphones', quantity: 5 }], customer, displayedTotalCents: 454500 },
      client
    );

    expect(result.status).toBe('cart-changed');
    expect(client.initialize).not.toHaveBeenCalled();
  });

  it('creates nothing when the shopper was shown a different total', async () => {
    const client = fakeClient();

    const result = await startCardPayment(
      { ...zx9Order, displayedTotalCents: zx9Total - 100 },
      client
    );

    expect(result).toMatchObject({ status: 'cart-changed' });
    expect(client.initialize).not.toHaveBeenCalled();
  });

  it('reports an order too large to pay online', async () => {
    const client = fakeClient({
      initialize: vi.fn(async () => {
        throw new PaystackApiError('Watch your spending. Amount cannot be processed online', 400);
      }),
    });

    expect(await startCardPayment({ ...zx9Order, displayedTotalCents: zx9Total }, client)).toEqual({
      status: 'too-large',
    });
  });

  it('logs unexpected Paystack errors without personal data, and rethrows them', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const client = fakeClient({
      initialize: vi.fn(async () => {
        throw new PaystackApiError('Invalid key', 401);
      }),
    });

    await expect(
      startCardPayment({ ...zx9Order, displayedTotalCents: zx9Total }, client)
    ).rejects.toThrow('Invalid key');
    expect(consoleError).toHaveBeenCalledWith('Paystack initialize failed (401): Invalid key');
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(customer.email);
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
      client
    );

    expect(result.status).toBe('cart-changed');
    expect(client.initialize).not.toHaveBeenCalled();
  });

  it('tags integration-test transactions in their reference', async () => {
    const client = fakeClient();

    await startCardPayment({ ...zx9Order, displayedTotalCents: zx9Total }, client, {
      testTransaction: true,
    });

    expect(vi.mocked(client.initialize).mock.calls[0][0].reference).toMatch(/^audiophile-test-/);
  });

  it('reports card payments as unavailable without a usable key', async () => {
    const client = fakeClient({
      initialize: vi.fn(async () => {
        throw new PaystackConfigError('PAYSTACK_SECRET_KEY is not set');
      }),
    });

    expect(await startCardPayment({ ...zx9Order, displayedTotalCents: zx9Total }, client)).toEqual({
      status: 'unavailable',
    });
  });
});

describe('confirmCardPayment', () => {
  const verified = (overrides = {}) => ({
    reference: REFERENCE,
    status: 'success',
    amount: 1440080000,
    currency: 'NGN',
    metadata: { amountKobo: 1440080000 },
    ...overrides,
  });

  it('accepts a successful naira charge for exactly the amount the server set', async () => {
    const client = fakeClient({ verify: vi.fn(async () => verified()) });

    expect(await confirmCardPayment(REFERENCE, client)).toEqual({ paid: true });
    expect(client.verify).toHaveBeenCalledWith(REFERENCE);
  });

  it('reads metadata Paystack returns as a JSON string', async () => {
    const client = fakeClient({
      verify: vi.fn(async () => verified({ metadata: JSON.stringify({ amountKobo: 1440080000 }) })),
    });

    expect(await confirmCardPayment(REFERENCE, client)).toEqual({ paid: true });
  });

  it.each([
    ['an abandoned payment', { status: 'abandoned' }],
    ['a failed payment', { status: 'failed' }],
    ['a different amount', { amount: 100 }],
    ['a different currency', { currency: 'USD' }],
    ['no expected amount', { metadata: {} }],
    ['unreadable metadata', { metadata: '{not json' }],
  ])('rejects %s', async (_, overrides) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const client = fakeClient({ verify: vi.fn(async () => verified(overrides)) });

    expect(await confirmCardPayment(REFERENCE, client)).toEqual({ paid: false });
  });

  it.each([
    ['not a string', 42],
    ['a foreign reference', 'T123456789'],
    ['path tricks', 'audiophile-../../x'],
  ])('rejects a reference that is %s without calling Paystack', async (_, reference) => {
    const client = fakeClient();

    await expect(confirmCardPayment(reference, client)).rejects.toThrow(InvalidPaymentRequestError);
    expect(client.verify).not.toHaveBeenCalled();
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
  it('creates a real test transaction that is unpaid until the shopper pays', async () => {
    const result = await startCardPayment(
      { ...zx9Order, displayedTotalCents: zx9Total },
      paystack,
      { testTransaction: true }
    );

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.accessCode).toBeTruthy();
    expect(await confirmCardPayment(result.reference)).toEqual({ paid: false });
  });
});
