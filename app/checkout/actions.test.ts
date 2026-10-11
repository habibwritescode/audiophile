// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';
import { confirmCardPayment as confirmLogic, placeCashOrder as cashLogic } from '@/lib/payments';
import { takeRateLimit } from '@/lib/rate-limit';
import { confirmCardPayment, placeCashOrder } from './actions';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-real-ip': '203.0.113.7' }),
}));
vi.mock('@/lib/rate-limit', () => ({
  PAYMENT_ATTEMPTS: {},
  takeRateLimit: vi.fn(async () => true),
}));
vi.mock('@/lib/payments', () => ({
  confirmCardPayment: vi.fn(),
  placeCashOrder: vi.fn(),
  startCardPayment: vi.fn(),
}));

const order = { id: 'order-id', number: 'AUD-000001' } as never;
const zx7 = [{ slug: 'zx7-speaker', category: 'speakers' }];
const request = { lines: [], customer: {}, displayedTotalCents: 0 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('checkout actions after stock changes', () => {
  it('revalidates the product and category pages after a cash order', async () => {
    vi.mocked(cashLogic).mockResolvedValueOnce({ status: 'placed', order, changedProducts: zx7 });

    // The browser gets the order, not the internal list of changed products
    expect(await placeCashOrder(request)).toEqual({ status: 'placed', order });
    expect(vi.mocked(revalidatePath).mock.calls).toEqual([
      ['/product/zx7-speaker'],
      ['/category/speakers'],
    ]);
  });

  it('revalidates after the confirmation that placed a card order, not after repeats', async () => {
    vi.mocked(confirmLogic)
      .mockResolvedValueOnce({ outcome: 'placed', order, changedProducts: zx7 })
      .mockResolvedValueOnce({ outcome: 'placed', order, changedProducts: [] });

    expect(await confirmCardPayment('ref')).toEqual({ outcome: 'placed', order });
    await confirmCardPayment('ref');

    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });

  it('revalidates nothing for a rate-limited attempt', async () => {
    vi.mocked(takeRateLimit).mockResolvedValueOnce(false);

    expect(await placeCashOrder(request)).toEqual({ status: 'rate-limited' });
    expect(cashLogic).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
