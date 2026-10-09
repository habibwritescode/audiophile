import { describe, expect, it } from 'vitest';
import { formatNaira, orderTotals, toChargeKobo } from './pricing';

describe('orderTotals', () => {
  it('adds up lines, adds $50 shipping and reports the included 20% VAT', () => {
    expect(
      orderTotals([
        { priceCents: 299900, quantity: 1 },
        { priceCents: 89900, quantity: 2 },
        { priceCents: 59900, quantity: 1 },
      ])
    ).toEqual({ total: 539600, shipping: 5000, vat: 107920, grandTotal: 544600 });
  });

  it('rounds VAT to the nearest cent', () => {
    expect(orderTotals([{ priceCents: 1, quantity: 3 }]).vat).toBe(1);
  });

  it('charges only shipping for an empty order', () => {
    expect(orderTotals([]).grandTotal).toBe(5000);
  });
});

describe('naira conversion', () => {
  it('converts cents to kobo at the demo rate, exactly', () => {
    // $1,848.00 = 184,800 cents -> ₦2,956,800.00 = 295,680,000 kobo
    expect(toChargeKobo(184800)).toBe(295680000);
  });

  it('formats kobo as whole naira', () => {
    expect(formatNaira(295680000)).toBe('₦2,956,800');
  });
});
