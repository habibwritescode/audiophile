import { describe, expect, it } from 'vitest';
import { formatAmount } from './helpers';

describe('formatAmount', () => {
  it('formats cents as whole US dollars', () => {
    expect(formatAmount(299900)).toBe('$2,999');
    expect(formatAmount(5000)).toBe('$50');
  });

  it('rounds to the nearest dollar', () => {
    expect(formatAmount(107920)).toBe('$1,079');
    expect(formatAmount(107950)).toBe('$1,080');
  });
});
