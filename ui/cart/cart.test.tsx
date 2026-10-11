import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateCart } from '@/app/checkout/actions';
import { CartCheckLine } from '@/lib/cart-check';
import { useCartStore } from '@/lib/cart-store';
import Cart from './cart';

vi.mock('@/app/checkout/actions', () => ({ validateCart: vi.fn() }));
const checkMock = vi.mocked(validateCart);

const xx59 = {
  slug: 'xx59-headphones',
  shortName: 'XX59',
  cartImage: '/assets/cart/image-xx59-headphones.jpg',
  priceCents: 89900,
};
const yx1 = {
  slug: 'yx1-earphones',
  shortName: 'YX1',
  cartImage: '/assets/cart/image-yx1-earphones.jpg',
  priceCents: 59900,
};

const renderCart = () => render(<Cart isOpen onClose={() => {}} />);
const row = (name: string) => screen.getByText(name).closest('li')!;

/** The server's answer when everything in the cart is still available as it was added */
const inStock = (lines: { slug: string }[], available = 10): CartCheckLine[] =>
  lines.map((line) => {
    const product = [xx59, yx1].find((p) => p.slug === line.slug)!;
    return { ...product, exists: true, available };
  });

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ lines: [] });
  checkMock.mockReset();
  checkMock.mockImplementation(async (lines) => inStock(lines as { slug: string }[]));
});

describe('Cart', () => {
  it('lists the cart with a product count and total', () => {
    useCartStore.getState().add(xx59, 2);
    useCartStore.getState().add(yx1, 1);

    renderCart();

    expect(screen.getByRole('heading', { name: 'Cart (2)' })).toBeInTheDocument();
    expect(within(row('XX59')).getByText('2')).toBeInTheDocument();
    expect(within(row('YX1')).getByText('$599')).toBeInTheDocument();
    expect(screen.getByText('$2,397')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Checkout' })).toHaveAttribute('href', '/checkout');
  });

  it('updates the cart and total when a quantity changes', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(xx59, 1);
    renderCart();

    await user.click(within(row('XX59')).getByRole('button', { name: 'Increase quantity' }));

    expect(useCartStore.getState().lines[0].quantity).toBe(2);
    expect(screen.getByText('$1,798')).toBeInTheDocument();
  });

  it('removes a product whose quantity goes to 0', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(xx59, 1);
    useCartStore.getState().add(yx1, 1);
    renderCart();

    await user.click(within(row('XX59')).getByRole('button', { name: 'Decrease quantity' }));

    expect(screen.queryByText('XX59')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cart (1)' })).toBeInTheDocument();
  });

  it('empties the cart with Remove all and shows the empty state', async () => {
    const user = userEvent.setup();
    useCartStore.getState().add(xx59, 1);
    renderCart();

    await user.click(screen.getByRole('button', { name: 'Remove all' }));

    expect(useCartStore.getState().lines).toEqual([]);
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Checkout' })).not.toBeInTheDocument();
  });

  it('checks stock on opening, corrects the cart and caps "+" at what is left', async () => {
    useCartStore.getState().add(xx59, 3);
    checkMock.mockResolvedValueOnce(inStock([xx59], 2));

    renderCart();

    expect(await screen.findByText('XX59: only 2 left, quantity updated')).toBeInTheDocument();
    expect(checkMock).toHaveBeenCalledWith([{ slug: 'xx59-headphones', quantity: 3 }]);
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
    expect(within(row('XX59')).getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  it('drops an answer about a cart that changed while the check ran', async () => {
    const user = userEvent.setup();
    let answer: (facts: CartCheckLine[]) => void = () => {};
    checkMock.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)));
    useCartStore.getState().add(xx59, 1);
    useCartStore.getState().add(yx1, 1);
    renderCart();

    await user.click(within(row('YX1')).getByRole('button', { name: 'Decrease quantity' }));
    await act(async () => answer(inStock([xx59], 0)));

    // A sold-out answer for the old cart would have removed XX59
    expect(useCartStore.getState().lines).toEqual([{ ...xx59, quantity: 1 }]);
    expect(screen.queryByText(/We updated your cart/)).not.toBeInTheDocument();
  });

  it('keeps the cart as it is when the check fails', async () => {
    useCartStore.getState().add(xx59, 2);
    checkMock.mockRejectedValueOnce(new Error('offline'));

    renderCart();
    await act(async () => {});

    expect(useCartStore.getState().lines[0].quantity).toBe(2);
    expect(within(row('XX59')).getByRole('button', { name: 'Increase quantity' })).toBeEnabled();
  });

  it('closes on a click just outside the cart card, and not on one inside it', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    useCartStore.getState().add(xx59, 1);
    render(<Cart isOpen onClose={onClose} />);
    const card = screen.getByRole('heading', { name: 'Cart (1)' }).closest('.bg-white')!;

    await user.click(card);
    expect(onClose).not.toHaveBeenCalled();

    // On screen, the dimmed space beside the card
    await user.click(card.parentElement!);
    expect(onClose).toHaveBeenCalled();
  });
});
