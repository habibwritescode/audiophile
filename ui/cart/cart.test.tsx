import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from '@/lib/cart-store';
import Cart from './cart';

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

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ lines: [] });
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
});
