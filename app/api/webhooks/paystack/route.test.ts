// @vitest-environment node
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';
import { fulfillCardPayment, recordRefundOutcome } from '@/lib/orders';
import { POST } from './route';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/orders', () => ({
  fulfillCardPayment: vi.fn(async () => ({ outcome: 'placed', changedProducts: [] })),
  recordRefundOutcome: vi.fn(async () => ({ count: 1 })),
}));

const KEY = 'sk_test_webhook';
const REFERENCE = 'audiophile-123e4567-e89b-42d3-a456-426614174000';

const sign = (body: string, key = KEY) => createHmac('sha512', key).update(body).digest('hex');

const deliver = (payload: unknown, { signature }: { signature?: string | null } = {}) => {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const headers = new Headers({ 'content-type': 'application/json' });
  const value = signature === undefined ? sign(body) : signature;
  if (value !== null) headers.set('x-paystack-signature', value);
  return POST(
    new Request('http://localhost/api/webhooks/paystack', { method: 'POST', body, headers })
  );
};

const chargeSuccess = { event: 'charge.success', data: { reference: REFERENCE, amount: 100 } };

beforeEach(() => {
  vi.stubEnv('PAYSTACK_SECRET_KEY', KEY);
  vi.mocked(fulfillCardPayment).mockClear();
  vi.mocked(recordRefundOutcome).mockClear();
  vi.mocked(revalidatePath).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Paystack webhook', () => {
  it('fulfils the order for a signed charge.success', async () => {
    const response = await deliver(chargeSuccess);

    expect(response.status).toBe(200);
    expect(fulfillCardPayment).toHaveBeenCalledWith(REFERENCE);
  });

  it('revalidates the pages of products whose stock the order took', async () => {
    vi.mocked(fulfillCardPayment).mockResolvedValueOnce({
      outcome: 'placed',
      order: {} as never,
      changedProducts: [
        { slug: 'xx59-headphones', category: 'headphones' },
        { slug: 'xx99-mark-two-headphones', category: 'headphones' },
      ],
    });

    await deliver(chargeSuccess);

    expect(
      vi
        .mocked(revalidatePath)
        .mock.calls.map(([path]) => path)
        .sort()
    ).toEqual([
      '/category/headphones',
      '/product/xx59-headphones',
      '/product/xx99-mark-two-headphones',
    ]);
  });

  it('revalidates nothing when an earlier delivery already placed the order', async () => {
    await deliver(chargeSuccess);

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('still acknowledges the event when revalidation fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(revalidatePath).mockImplementationOnce(() => {
      throw new Error('cache unavailable');
    });
    vi.mocked(fulfillCardPayment).mockResolvedValueOnce({
      outcome: 'placed',
      order: {} as never,
      changedProducts: [{ slug: 'zx7-speaker', category: 'speakers' }],
    });

    expect((await deliver(chargeSuccess)).status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith('/category/speakers');
  });

  it.each([
    ['no signature', null],
    ['a signature made with another key', sign(JSON.stringify(chargeSuccess), 'sk_test_other')],
    ['a garbage signature', 'abc'],
  ])('rejects %s without doing anything', async (_, signature) => {
    const response = await deliver(chargeSuccess, { signature });

    expect(response.status).toBe(401);
    expect(fulfillCardPayment).not.toHaveBeenCalled();
  });

  it('rejects a body changed after signing', async () => {
    const signature = sign(JSON.stringify(chargeSuccess));
    const tampered = { ...chargeSuccess, data: { ...chargeSuccess.data, amount: 1 } };

    expect((await deliver(tampered, { signature })).status).toBe(401);
    expect(fulfillCardPayment).not.toHaveBeenCalled();
  });

  it('records refund outcomes', async () => {
    await deliver({ event: 'refund.processed', data: { transaction_reference: REFERENCE } });
    await deliver({ event: 'refund.failed', data: { transaction_reference: REFERENCE } });

    expect(recordRefundOutcome).toHaveBeenNthCalledWith(1, REFERENCE, 'processed');
    expect(recordRefundOutcome).toHaveBeenNthCalledWith(2, REFERENCE, 'failed');
  });

  it('acknowledges and ignores other events and foreign references', async () => {
    expect((await deliver({ event: 'transfer.success', data: {} })).status).toBe(200);
    expect(
      (await deliver({ event: 'charge.success', data: { reference: 'T123456' } })).status
    ).toBe(200);

    expect(fulfillCardPayment).not.toHaveBeenCalled();
  });

  it('answers 500 when fulfilment fails, so Paystack retries', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fulfillCardPayment).mockRejectedValueOnce(new Error('database down'));

    expect((await deliver(chargeSuccess)).status).toBe(500);
  });

  it('rejects signed bodies that are not JSON', async () => {
    expect((await deliver('not json')).status).toBe(400);
  });

  it('answers 503 when no Paystack key is configured', async () => {
    vi.stubEnv('PAYSTACK_SECRET_KEY', '');

    expect((await deliver(chargeSuccess, { signature: 'x' })).status).toBe(503);
    expect(fulfillCardPayment).not.toHaveBeenCalled();
  });
});
