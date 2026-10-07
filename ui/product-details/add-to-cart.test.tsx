import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCartStore } from '@/lib/cart-store';
import AddToCart, { ADDED_FEEDBACK_MS } from './add-to-cart';

const zx9 = {
  slug: 'zx9-speaker',
  shortName: 'ZX9',
  cartImage: '/assets/cart/image-zx9-speaker.jpg',
  priceCents: 450000,
};

const lines = () => useCartStore.getState().lines;

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ lines: [] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AddToCart', () => {
  it('adds the selected quantity to the cart', async () => {
    const user = userEvent.setup();
    render(<AddToCart product={zx9} />);

    await user.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await user.click(screen.getByRole('button', { name: 'Add To Cart' }));

    expect(lines()).toEqual([{ ...zx9, quantity: 2 }]);
  });

  it('merges with what is already in the cart', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(zx9, 3);
    render(<AddToCart product={zx9} />);

    await user.click(screen.getByRole('button', { name: 'Add To Cart' }));

    expect(lines()).toEqual([{ ...zx9, quantity: 4 }]);
  });

  it('confirms with "Added" and an announcement, then reverts after two seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AddToCart product={zx9} />);

    await user.click(screen.getByRole('button', { name: 'Add To Cart' }));

    expect(screen.getByRole('button', { name: 'Added' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Added to cart');

    act(() => {
      vi.advanceTimersByTime(ADDED_FEEDBACK_MS);
    });

    expect(screen.getByRole('button', { name: 'Add To Cart' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('adds again when clicked while showing "Added"', async () => {
    const user = userEvent.setup();
    render(<AddToCart product={zx9} />);

    await user.click(screen.getByRole('button', { name: 'Add To Cart' }));
    await user.click(screen.getByRole('button', { name: 'Added' }));

    expect(lines()[0].quantity).toBe(2);
  });
});
