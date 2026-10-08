import { createElement } from 'react';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CartCheckLine, MAX_CART_LINES, reconcileCart, sanitizeCartLines } from './cart-check';
import { CartLine, useCartStore } from './cart-store';

const STORAGE_KEY = 'audiophile-cart';

const zx9 = {
  slug: 'zx9-speaker',
  shortName: 'ZX9',
  cartImage: '/assets/cart/image-zx9-speaker.jpg',
  priceCents: 450000,
};
const xx59 = {
  slug: 'xx59-headphones',
  shortName: 'XX59',
  cartImage: '/assets/cart/image-xx59-headphones.jpg',
  priceCents: 89900,
};

const fact = (product: typeof zx9, available: number, overrides = {}): CartCheckLine => ({
  ...product,
  exists: true,
  available,
  ...overrides,
});

const lines = () => useCartStore.getState().lines;

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ lines: [] });
});

describe('cart store', () => {
  it('adds a product with the chosen quantity', () => {
    useCartStore.getState().add(zx9, 2);

    expect(lines()).toEqual([{ ...zx9, quantity: 2 }]);
  });

  it('merges repeated adds of the same product and keeps other lines', () => {
    useCartStore.getState().add(zx9, 1);
    useCartStore.getState().add(xx59, 1);
    useCartStore.getState().add(zx9, 3);

    expect(lines().map(({ slug, quantity }) => [slug, quantity])).toEqual([
      ['zx9-speaker', 4],
      ['xx59-headphones', 1],
    ]);
  });

  it('caps a line at 99', () => {
    useCartStore.getState().add(zx9, 60);
    useCartStore.getState().add(zx9, 60);

    expect(lines()[0].quantity).toBe(99);
  });

  it('removes a line when its quantity is set to 0', () => {
    useCartStore.getState().add(zx9, 2);
    useCartStore.getState().add(xx59, 1);

    useCartStore.getState().setQuantity('zx9-speaker', 0);

    expect(lines().map((line) => line.slug)).toEqual(['xx59-headphones']);
  });

  it('clears every line', () => {
    useCartStore.getState().add(zx9, 1);
    useCartStore.getState().add(xx59, 1);

    useCartStore.getState().clear();

    expect(lines()).toEqual([]);
  });

  it('saves the cart to localStorage', () => {
    useCartStore.getState().add(zx9, 2);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toEqual({ state: { lines: [{ ...zx9, quantity: 2 }] }, version: 1 });
  });

  it('loads a stored cart when rehydrated', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { lines: [{ ...xx59, quantity: 3 }] }, version: 1 })
    );

    await useCartStore.persist.rehydrate();

    expect(lines()).toEqual([{ ...xx59, quantity: 3 }]);
  });

  it('quietly discards a cart stored with an older version', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { items: [{ id: 1 }] }, version: 0 })
    );

    await useCartStore.persist.rehydrate();

    expect(lines()).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('applies a server check and returns its messages', () => {
    useCartStore.getState().add(zx9, 5);

    const messages = useCartStore.getState().applyServerCheck([fact(zx9, 2)]);

    expect(lines()[0].quantity).toBe(2);
    expect(messages).toEqual(['ZX9: only 2 left, quantity updated']);
  });
});

describe('stored cart cleanup', () => {
  const store = (lines: unknown) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { lines }, version: 1 }));

  it('drops a stored line with a missing field instead of breaking the cart', async () => {
    store([
      { slug: 'zx9-speaker', shortName: 'ZX9', priceCents: 450000, quantity: 1 },
      { ...xx59, quantity: 2 },
    ]);

    await useCartStore.persist.rehydrate();

    expect(lines()).toEqual([{ ...xx59, quantity: 2 }]);
  });

  it('drops a stored cart that is not a list', async () => {
    store('nonsense');

    await useCartStore.persist.rehydrate();

    expect(lines()).toEqual([]);
  });

  it('stops adding new products at the line limit', () => {
    for (let i = 0; i < MAX_CART_LINES + 2; i++) {
      useCartStore.getState().add({ ...zx9, slug: `product-${i}` }, 1);
    }

    expect(lines()).toHaveLength(MAX_CART_LINES);
  });

  it('keeps the same cart when a check changes nothing', () => {
    useCartStore.getState().add(zx9, 1);
    const before = lines();

    useCartStore.getState().applyServerCheck([fact(zx9, 10)]);

    expect(lines()).toBe(before);
  });
});

describe('sanitizeCartLines', () => {
  const valid = { ...zx9, quantity: 2 };

  it('keeps well-formed lines', () => {
    expect(sanitizeCartLines([valid])).toEqual([valid]);
  });

  it.each([
    ['a missing slug', { ...valid, slug: undefined }],
    ['an empty short name', { ...valid, shortName: ' ' }],
    ['an image that is not a site path', { ...valid, cartImage: 'https://evil.example/x.jpg' }],
    ['a zero price', { ...valid, priceCents: 0 }],
    ['a fractional price', { ...valid, priceCents: 1.5 }],
    ['a string quantity', { ...valid, quantity: '2' }],
    ['a zero quantity', { ...valid, quantity: 0 }],
    ['an infinite quantity', { ...valid, quantity: Infinity }],
    ['null', null],
  ])('drops a line with %s', (_, line) => {
    expect(sanitizeCartLines([line])).toEqual([]);
  });

  it('clamps quantities to 1–99 and drops the fraction', () => {
    expect(sanitizeCartLines([{ ...valid, quantity: 150 }])[0].quantity).toBe(99);
    expect(sanitizeCartLines([{ ...valid, quantity: 2.7 }])[0].quantity).toBe(2);
  });

  it('merges duplicate products', () => {
    expect(sanitizeCartLines([valid, { ...valid, quantity: 3 }])).toEqual([
      { ...valid, quantity: 5 },
    ]);
  });

  it('caps the cart at the line limit', () => {
    const many = Array.from({ length: MAX_CART_LINES + 5 }, (_, i) => ({
      ...valid,
      slug: `p-${i}`,
    }));

    expect(sanitizeCartLines(many)).toHaveLength(MAX_CART_LINES);
  });

  it('returns an empty cart for anything that is not a list', () => {
    expect(sanitizeCartLines({ lines: [valid] })).toEqual([]);
    expect(sanitizeCartLines(undefined)).toEqual([]);
  });
});

describe('reconcileCart', () => {
  const cart: CartLine[] = [
    { ...zx9, quantity: 2 },
    { ...xx59, quantity: 3 },
  ];

  it('changes nothing and says nothing when everything is available at the same price', () => {
    expect(reconcileCart(cart, [fact(zx9, 10), fact(xx59, 10)])).toEqual({
      lines: cart,
      messages: [],
    });
  });

  it('lowers a quantity to what is in stock', () => {
    const result = reconcileCart(cart, [fact(zx9, 10), fact(xx59, 2)]);

    expect(result.lines[1].quantity).toBe(2);
    expect(result.messages).toEqual(['XX59: only 2 left, quantity updated']);
  });

  it('removes sold-out and unknown products', () => {
    const result = reconcileCart(cart, [fact(zx9, 0), { slug: 'xx59-headphones', exists: false }]);

    expect(result.lines).toEqual([]);
    expect(result.messages).toEqual([
      'ZX9: sold out, removed',
      'XX59: no longer available, removed',
    ]);
  });

  it('treats a product missing from the check as no longer available', () => {
    const result = reconcileCart(cart, [fact(zx9, 10)]);

    expect(result.lines.map((line) => line.slug)).toEqual(['zx9-speaker']);
    expect(result.messages).toEqual(['XX59: no longer available, removed']);
  });

  it('uses the current price and display fields from the server', () => {
    const result = reconcileCart(cart, [
      fact(zx9, 10, { priceCents: 460000, shortName: 'ZX9 Speaker' }),
      fact(xx59, 10),
    ]);

    expect(result.lines[0]).toMatchObject({ priceCents: 460000, shortName: 'ZX9 Speaker' });
    expect(result.messages).toEqual(['ZX9 Speaker: price changed to $4,600']);
  });

  it('reports a quantity and a price change on the same line', () => {
    const result = reconcileCart([{ ...zx9, quantity: 5 }], [fact(zx9, 1, { priceCents: 440000 })]);

    expect(result.messages).toEqual([
      'ZX9: only 1 left, quantity updated',
      'ZX9: price changed to $4,400',
    ]);
  });
});

describe('hydration', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the same HTML on the server and in the browser, then shows the stored cart', async () => {
    // Testing Library sets this for its own render; this test calls hydrateRoot directly
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    // A fresh module, as on a real page load: earlier tests have already hydrated the shared store
    vi.resetModules();
    const fresh = await import('./cart-store');
    const CartCount = () => {
      const hydrated = fresh.useCartHydrated();
      const count = fresh.useCartStore((state) => state.lines.length);
      return createElement('p', null, hydrated ? `items: ${count}` : 'loading');
    };
    const serverHtml = renderToString(createElement(CartCount));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { lines: [{ ...zx9, quantity: 1 }] }, version: 1 })
    );
    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const recoverableErrors: unknown[] = [];

    await act(async () => {
      hydrateRoot(container, createElement(CartCount), {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });
    expect(serverHtml).toContain('loading');
    expect(container.textContent).toBe('loading');

    await act(async () => {
      await fresh.useCartStore.persist.rehydrate();
    });

    expect(container.textContent).toBe('items: 1');
    expect(recoverableErrors).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
