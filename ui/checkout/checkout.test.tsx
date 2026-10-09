import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmCardPayment, startCardPayment, validateCart } from '@/app/checkout/actions';
import { CartCheckLine } from '@/lib/cart-check';
import { useCartStore } from '@/lib/cart-store';
import Checkout, {
  CHECK_FAILED_MESSAGE,
  MAX_CHECK_ATTEMPTS,
  PAYMENT_CANCELLED_MESSAGE,
  PAYMENT_FAILED_MESSAGE,
  PAYMENT_TOO_LARGE_MESSAGE,
  paymentUnconfirmedMessage,
} from './checkout';

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }));
vi.mock('@/app/checkout/actions', () => ({
  validateCart: vi.fn(),
  startCardPayment: vi.fn(),
  confirmCardPayment: vi.fn(),
}));

// Paystack's popup: each test decides what the shopper does in it
const popup = vi.hoisted(() => ({
  resume: vi.fn(),
  outcome: 'success' as 'success' | 'cancel' | 'error',
}));
vi.mock('@paystack/inline-js', () => ({
  default: class {
    resumeTransaction(
      accessCode: string,
      callbacks: {
        onSuccess: (t: { reference: string }) => void;
        onCancel: () => void;
        onError: (e: { message: string }) => void;
      }
    ) {
      popup.resume(accessCode);
      if (popup.outcome === 'success') callbacks.onSuccess({ reference: 'audiophile-ref' });
      else if (popup.outcome === 'cancel') callbacks.onCancel();
      else callbacks.onError({ message: 'could not load' });
    }
  },
}));

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
const startMock = vi.mocked(startCardPayment);
const confirmMock = vi.mocked(confirmCardPayment);

const renderWithCart = async (quantity: number, { cardAvailable = true } = {}) => {
  useCartStore.setState({ lines: quantity ? [{ ...xx59, quantity }] : [] });
  await act(() => useCartStore.persist.rehydrate());
  render(<Checkout cardAvailable={cardAvailable} />);
  await act(async () => {}); // let the check on arrival settle
  return userEvent.setup();
};

const fillAndPay = async (
  user: ReturnType<typeof userEvent.setup>,
  method: 'Card' | 'Cash on Delivery' = 'Cash on Delivery'
) => {
  await user.type(screen.getByLabelText('Name'), 'Alexei Ward');
  await user.type(screen.getByLabelText('Email Address'), 'alexei@mail.com');
  await user.type(screen.getByLabelText('Phone Number'), '+1 202-555-0136');
  await user.type(screen.getByLabelText('Your Address'), '1137 Williams Avenue');
  await user.type(screen.getByLabelText('ZIP Code'), '10001');
  await user.type(screen.getByLabelText('City'), 'New York');
  await user.type(screen.getByLabelText('Country'), 'United States');
  await user.click(screen.getByLabelText(method));
  await user.click(screen.getByRole('button', { name: 'Continue & Pay' }));
};

beforeEach(() => {
  localStorage.clear();
  checkMock.mockReset();
  startMock.mockReset();
  confirmMock.mockReset();
  popup.resume.mockReset();
  popup.outcome = 'success';
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

  it('confirms a Cash on Delivery order that is still valid, emptying the cart at once', async () => {
    checkMock.mockResolvedValue(inStock());
    const user = await renderWithCart(1);

    await fillAndPay(user);

    expect(checkMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('heading', { name: /thank you/i })).toBeInTheDocument();
    expect(useCartStore.getState().lines).toEqual([]);
    expect(startMock).not.toHaveBeenCalled();
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

describe('Checkout card payments', () => {
  const ready = {
    status: 'ready' as const,
    accessCode: 'access-code',
    reference: 'audiophile-ref',
    amountKobo: 151840000, // ($899 x 1 + $50) x 1,600 in kobo
  };

  beforeEach(() => {
    checkMock.mockResolvedValue(inStock());
  });

  it('shows the naira amount for card, and hides it for cash', async () => {
    const user = await renderWithCart(1);

    expect(screen.getByText('You’ll be charged ₦1,518,400 by card.')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Cash on Delivery'));
    expect(screen.queryByText(/You’ll be charged/)).not.toBeInTheDocument();
  });

  it('pays in the popup, confirms with the server, then empties the cart', async () => {
    startMock.mockResolvedValue(ready);
    confirmMock.mockResolvedValue({ paid: true });
    const user = await renderWithCart(1);

    await fillAndPay(user, 'Card');

    expect(startMock).toHaveBeenCalledWith({
      lines: [{ slug: 'xx59-headphones', quantity: 1 }],
      customer: { name: 'Alexei Ward', email: 'alexei@mail.com', phone: '+1 202-555-0136' },
      displayedTotalCents: 94900,
    });
    expect(popup.resume).toHaveBeenCalledWith('access-code');
    expect(confirmMock).toHaveBeenCalledWith('audiophile-ref');
    expect(screen.getByRole('heading', { name: /thank you/i })).toBeInTheDocument();
    expect(screen.getByText('Paid ₦1,518,400 by card')).toBeInTheDocument();
    expect(useCartStore.getState().lines).toEqual([]);
  });

  it('keeps the cart when the shopper closes the popup', async () => {
    startMock.mockResolvedValue(ready);
    popup.outcome = 'cancel';
    const user = await renderWithCart(1);

    await fillAndPay(user, 'Card');

    expect(screen.getByRole('alert')).toHaveTextContent(PAYMENT_CANCELLED_MESSAGE);
    expect(confirmMock).not.toHaveBeenCalled();
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Continue & Pay' })).toBeEnabled();
  });

  it('does not confirm, or offer to pay again, when the server cannot verify the payment', async () => {
    startMock.mockResolvedValue(ready);
    confirmMock.mockResolvedValue({ paid: false });
    const user = await renderWithCart(1);

    await fillAndPay(user, 'Card');

    expect(screen.getByRole('alert')).toHaveTextContent(
      paymentUnconfirmedMessage('audiophile-ref')
    );
    expect(screen.queryByRole('heading', { name: /thank you/i })).not.toBeInTheDocument();
    expect(useCartStore.getState().lines).toHaveLength(1);
    // In the notice and on the summary's button, which no longer pays
    expect(screen.getAllByRole('button', { name: 'Check payment again' })).toHaveLength(2);
  });

  it('re-checks the same payment instead of starting a new one, and confirms once it settles', async () => {
    startMock.mockResolvedValue(ready);
    confirmMock.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ paid: true });
    const user = await renderWithCart(1);

    await fillAndPay(user, 'Card');
    expect(screen.getByRole('alert')).toHaveTextContent(
      paymentUnconfirmedMessage('audiophile-ref')
    );

    // The summary's button now re-checks; it must not open a second payment
    await user.click(screen.getAllByRole('button', { name: 'Check payment again' }).at(-1)!);

    expect(startMock).toHaveBeenCalledOnce();
    expect(popup.resume).toHaveBeenCalledOnce();
    expect(confirmMock).toHaveBeenCalledTimes(2);
    expect(confirmMock).toHaveBeenLastCalledWith('audiophile-ref');
    expect(screen.getByRole('heading', { name: /thank you/i })).toBeInTheDocument();
    expect(useCartStore.getState().lines).toEqual([]);
  });

  it('tells the shopper they have not been charged when the popup fails', async () => {
    startMock.mockResolvedValue(ready);
    popup.outcome = 'error';
    const user = await renderWithCart(1);

    await fillAndPay(user, 'Card');

    expect(screen.getByRole('alert')).toHaveTextContent('You haven’t been charged');
    expect(screen.queryByRole('button', { name: 'Check payment again' })).not.toBeInTheDocument();
  });

  it('shows the failure message when the popup fails to load', async () => {
    startMock.mockResolvedValue(ready);
    popup.outcome = 'error';
    const user = await renderWithCart(1);

    await fillAndPay(user, 'Card');

    expect(screen.getByRole('alert')).toHaveTextContent(PAYMENT_FAILED_MESSAGE);
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('corrects a stale cart without opening the popup', async () => {
    startMock.mockResolvedValue({
      status: 'cart-changed',
      check: inStock(10, { priceCents: 94900 }),
    });
    const user = await renderWithCart(1);

    await fillAndPay(user, 'Card');

    expect(screen.getByRole('status')).toHaveTextContent('XX59: price changed to $949');
    expect(popup.resume).not.toHaveBeenCalled();
  });

  it('explains when the order is too large to pay by card', async () => {
    startMock.mockResolvedValue({ status: 'too-large' });
    const user = await renderWithCart(1);

    await fillAndPay(user, 'Card');

    expect(screen.getByRole('alert')).toHaveTextContent(PAYMENT_TOO_LARGE_MESSAGE);
    expect(popup.resume).not.toHaveBeenCalled();
  });

  it('shows the failure message when starting the payment throws', async () => {
    startMock.mockRejectedValue(new Error('network'));
    const user = await renderWithCart(1);

    await fillAndPay(user, 'Card');

    expect(screen.getByRole('alert')).toHaveTextContent(PAYMENT_FAILED_MESSAGE);
  });

  it('offers only Cash on Delivery when card payments are not configured', async () => {
    await renderWithCart(1, { cardAvailable: false });

    expect(screen.getByLabelText('Card')).toBeDisabled();
    expect(screen.getByLabelText('Cash on Delivery')).toBeChecked();
    expect(screen.queryByText(/You’ll be charged/)).not.toBeInTheDocument();
  });
});
