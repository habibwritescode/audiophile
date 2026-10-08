import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateCart } from '@/app/checkout/actions';
import { CartCheckLine } from '@/lib/cart-check';
import { useCartStore } from '@/lib/cart-store';
import Checkout, { CHECK_FAILED_MESSAGE, MAX_CHECK_ATTEMPTS } from './checkout';

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }));
vi.mock('@/app/checkout/actions', () => ({ validateCart: vi.fn() }));

const xx59 = {
  slug: 'xx59-headphones',
  shortName: 'XX59',
  cartImage: '/assets/cart/image-xx59-headphones.jpg',
  priceCents: 89900,
};

const inStock = (available = 10, overrides = {}): CartCheckLine[] => [
  { ...xx59, exists: true, available, ...overrides },
];

const checkMock = vi.mocked(validateCart);

const renderWithCart = async (quantity: number) => {
  useCartStore.setState({ lines: quantity ? [{ ...xx59, quantity }] : [] });
  await act(() => useCartStore.persist.rehydrate());
  render(<Checkout />);
  await act(async () => {}); // let the check on arrival settle
  return userEvent.setup();
};

const fillAndPay = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Name'), 'Alexei Ward');
  await user.type(screen.getByLabelText('Email Address'), 'alexei@mail.com');
  await user.type(screen.getByLabelText('Phone Number'), '+1 202-555-0136');
  await user.type(screen.getByLabelText('Your Address'), '1137 Williams Avenue');
  await user.type(screen.getByLabelText('ZIP Code'), '10001');
  await user.type(screen.getByLabelText('City'), 'New York');
  await user.type(screen.getByLabelText('Country'), 'United States');
  await user.click(screen.getByLabelText('Cash on Delivery'));
  await user.click(screen.getByRole('button', { name: 'Continue & Pay' }));
};

beforeEach(() => {
  localStorage.clear();
  checkMock.mockReset();
});

describe('Checkout', () => {
  it('shows an empty state instead of the form for an empty cart', async () => {
    await renderWithCart(0);

    expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('button', { name: 'Continue & Pay' })).not.toBeInTheDocument();
    expect(checkMock).not.toHaveBeenCalled();
  });

  it('checks the cart on arrival and corrects it before the form is filled in', async () => {
    checkMock.mockResolvedValue(inStock(2));

    await renderWithCart(5);

    expect(checkMock).toHaveBeenCalledWith([{ slug: 'xx59-headphones', quantity: 5 }]);
    expect(screen.getByRole('status')).toHaveTextContent('XX59: only 2 left, quantity updated');
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
  });

  it('shows the empty state with the reason when every product is sold out', async () => {
    checkMock.mockResolvedValue(inStock(0));

    await renderWithCart(1);

    expect(screen.getByRole('status')).toHaveTextContent('XX59: sold out, removed');
    expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
  });

  it('opens the confirmation when the cart is still valid on submit, and Back to home empties it', async () => {
    checkMock.mockResolvedValue(inStock());
    const user = await renderWithCart(1);

    await fillAndPay(user);

    expect(checkMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('heading', { name: /thank you/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Back to home' }));

    expect(useCartStore.getState().lines).toEqual([]);
  });

  it('stops at the summary when the cart changed while the form was filled in', async () => {
    checkMock
      .mockResolvedValueOnce(inStock())
      .mockResolvedValueOnce(inStock(10, { priceCents: 94900 }));
    const user = await renderWithCart(1);

    await fillAndPay(user);

    expect(screen.getByRole('status')).toHaveTextContent('XX59: price changed to $949');
    expect(screen.queryByRole('heading', { name: /thank you/i })).not.toBeInTheDocument();
    // Totals follow the corrected price: $949 + $50 shipping
    expect(screen.getByText('$999')).toBeInTheDocument();
  });

  it('asks to try again when the check fails, without changing the cart', async () => {
    checkMock.mockResolvedValueOnce(inStock()).mockRejectedValueOnce(new Error('offline'));
    const user = await renderWithCart(3);

    await fillAndPay(user);

    expect(screen.getByRole('alert')).toHaveTextContent(CHECK_FAILED_MESSAGE);
    expect(screen.queryByRole('heading', { name: /thank you/i })).not.toBeInTheDocument();
    expect(useCartStore.getState().lines[0].quantity).toBe(3);
  });

  it('re-checks when the cart changes while a check is running, and corrects the new cart', async () => {
    checkMock
      .mockImplementationOnce(async () => {
        // The shopper adds one more while the first check is in flight
        useCartStore.getState().setQuantity('xx59-headphones', 3);
        return inStock(10);
      })
      .mockResolvedValueOnce(inStock(2));

    await renderWithCart(1);

    expect(checkMock).toHaveBeenCalledTimes(2);
    expect(checkMock).toHaveBeenLastCalledWith([{ slug: 'xx59-headphones', quantity: 3 }]);
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
    expect(screen.getByRole('status')).toHaveTextContent('XX59: only 2 left, quantity updated');
  });

  it('gives up after a few attempts if the cart never stops changing', async () => {
    let quantity = 1;
    checkMock.mockImplementation(async () => {
      useCartStore.getState().setQuantity('xx59-headphones', ++quantity);
      return inStock(10);
    });

    await renderWithCart(1);

    expect(checkMock).toHaveBeenCalledTimes(MAX_CHECK_ATTEMPTS);
    expect(screen.getByRole('alert')).toHaveTextContent(CHECK_FAILED_MESSAGE);
  });

  it('moves focus to the update when the submit-time check changes the cart', async () => {
    checkMock
      .mockResolvedValueOnce(inStock())
      .mockResolvedValueOnce(inStock(10, { priceCents: 94900 }));
    const user = await renderWithCart(1);

    await fillAndPay(user);

    expect(screen.getByRole('status').parentElement).toHaveFocus();
  });

  it('does not move focus for the check on arrival', async () => {
    checkMock.mockResolvedValue(inStock(2));

    await renderWithCart(5);

    expect(screen.getByRole('status').parentElement).not.toHaveFocus();
  });
});
