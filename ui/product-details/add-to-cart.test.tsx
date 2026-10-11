import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCartModal } from '@/lib/cart-modal';
import { useCartStore } from '@/lib/cart-store';
import AddToCart, { ADDED_FEEDBACK_MS } from './add-to-cart';

const zx9 = {
  slug: 'zx9-speaker',
  shortName: 'ZX9',
  cartImage: '/assets/cart/image-zx9-speaker.jpg',
  priceCents: 450000,
};

const lines = () => useCartStore.getState().lines;

beforeEach(async () => {
  localStorage.clear();
  useCartStore.setState({ lines: [] });
  // In the app, CartHydration loads the stored cart; until then the controls stay disabled
  await useCartStore.persist.rehydrate();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AddToCart', () => {
  it('adds the selected quantity to the cart', async () => {
    const user = userEvent.setup();
    render(<AddToCart product={zx9} stock={10} />);

    await user.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await user.click(screen.getByRole('button', { name: 'Add To Cart' }));

    expect(lines()).toEqual([{ ...zx9, quantity: 2 }]);
  });

  it('merges with what is already in the cart', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(zx9, 3);
    render(<AddToCart product={zx9} stock={10} />);

    await user.click(screen.getByRole('button', { name: 'Add To Cart' }));

    expect(lines()).toEqual([{ ...zx9, quantity: 4 }]);
  });

  it('confirms with "Added" and an announcement, then reverts after two seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AddToCart product={zx9} stock={10} />);

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
    render(<AddToCart product={zx9} stock={10} />);

    await user.click(screen.getByRole('button', { name: 'Add To Cart' }));
    await user.click(screen.getByRole('button', { name: 'Added' }));

    expect(lines()[0].quantity).toBe(2);
  });

  it('is disabled in the server HTML, so clicks before the page is ready are not lost', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<AddToCart product={zx9} stock={10} />);

    const buttons = [...container.querySelectorAll('button')];
    expect(buttons.map((button) => button.textContent)).toEqual(['-', '+', 'Add To Cart']);
    expect(buttons.every((button) => button.disabled)).toBe(true);
  });

  it('is enabled once running in the browser', () => {
    render(<AddToCart product={zx9} stock={10} />);

    expect(screen.getByRole('button', { name: 'Add To Cart' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeEnabled();
  });

  it('cannot add a sold-out product', () => {
    render(<AddToCart product={zx9} stock={0} />);

    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  it('stops the quantity at what is in stock', async () => {
    const user = userEvent.setup();
    render(<AddToCart product={zx9} stock={3} />);
    const increase = screen.getByRole('button', { name: 'Increase quantity' });

    for (let i = 0; i < 2; i++) await user.click(increase);

    expect(increase).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Add To Cart' }));
    expect(lines()[0].quantity).toBe(3);
  });

  it('counts what is already in the cart, and says when the cart holds it all', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useCartStore.getState().add(zx9, 2);
    render(<AddToCart product={zx9} stock={3} />);

    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Add To Cart' }));
    act(() => {
      vi.advanceTimersByTime(ADDED_FEEDBACK_MS);
    });

    expect(lines()[0].quantity).toBe(3);
    expect(screen.getByRole('button', { name: 'All 3 in cart' })).toBeDisabled();
  });

  it('offers a way to the cart once something has been added', async () => {
    const user = userEvent.setup();
    useCartModal.setState({ isOpen: false });
    render(<AddToCart product={zx9} stock={10} />);
    expect(screen.queryByRole('button', { name: 'View cart' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add To Cart' }));
    await user.click(screen.getByRole('button', { name: 'View cart' }));

    expect(useCartModal.getState().isOpen).toBe(true);
  });
});
