import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCartStore } from '@/lib/cart-store';
import Header from './header';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

const product = (slug: string) => ({
  slug,
  shortName: slug,
  cartImage: `/assets/cart/image-${slug}.jpg`,
  priceCents: 100,
});

const cartButton = () => screen.getByRole('button', { name: /^Open cart/ });

beforeEach(async () => {
  localStorage.clear();
  useCartStore.setState({ lines: [] });
  // The badge waits for the stored cart to load, as in the browser
  await act(() => useCartStore.persist.rehydrate());
});

describe('Header cart badge', () => {
  it('is hidden when the cart is empty', () => {
    render(<Header />);

    expect(cartButton()).toHaveAccessibleName('Open cart');
    expect(cartButton()).toHaveTextContent('');
  });

  it('shows the total number of items, not products', () => {
    useCartStore.getState().add(product('xx59-headphones'), 2);
    useCartStore.getState().add(product('yx1-earphones'), 1);

    render(<Header />);

    expect(cartButton()).toHaveTextContent('3');
    expect(cartButton()).toHaveAccessibleName('Open cart, 3 items');
  });

  it('uses the singular for one item', () => {
    useCartStore.getState().add(product('yx1-earphones'), 1);

    render(<Header />);

    expect(cartButton()).toHaveAccessibleName('Open cart, 1 item');
  });

  it('updates when items are added', () => {
    render(<Header />);

    act(() => useCartStore.getState().add(product('zx9-speaker'), 4));

    expect(cartButton()).toHaveTextContent('4');
  });

  it('caps the display at 99+', () => {
    useCartStore.getState().add(product('a'), 99);
    useCartStore.getState().add(product('b'), 5);

    render(<Header />);

    expect(cartButton()).toHaveTextContent('99+');
    expect(cartButton()).toHaveAccessibleName('Open cart, 104 items');
  });
});
