import { describe, expect, it } from 'vitest';
import { stockLabel } from './stock';

describe('stockLabel', () => {
  it.each([
    [0, 'Sold out'],
    [1, 'Only 1 left'],
    [5, 'Only 5 left'],
    [6, null],
  ])('labels %i in stock as %s', (stock, label) => {
    expect(stockLabel(stock)).toBe(label);
  });
});
