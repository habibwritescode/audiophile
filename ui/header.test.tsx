import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCartModal } from '@/lib/cart-modal';
import { useCartStore } from '@/lib/cart-store';
import Header from './header';

let pathname = '/';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));
vi.mock('@/app/checkout/actions', () => ({ validateCart: vi.fn(async () => []) }));

const product = (slug: string) => ({
  slug,
  shortName: slug,
  cartImage: `/assets/cart/image-${slug}.jpg`,
  priceCents: 100,
});

const cartButton = () => screen.getByRole('button', { name: /^Open cart/ });

beforeEach(async () => {
  pathname = '/';
  useCartModal.setState({ isOpen: false });
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

describe('Header modals', () => {
  it('closes the open cart on a click elsewhere in the header', async () => {
    const user = userEvent.setup();
    // As in the root layout: the header is a direct child of <body>. Headless UI v2 treats other
    // top-level elements as part of the dialog's own tree (its root-containers rule), so clicks
    // there aren't "outside". Rendered inside RTL's usual wrapper <div>, this passes even without
    // the fix: after a Headless UI upgrade, check that it still fails with the header handler removed.
    render(<Header />, { container: document.body });
    await user.click(cartButton());
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // While open, the toggle says what it does now
    expect(screen.getByRole('button', { name: 'Close cart', hidden: true })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await user.click(screen.getByRole('banner', { hidden: true }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the open cart when the page changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Header />);
    await user.click(cartButton());

    pathname = '/category/speakers';
    rerender(<Header />);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
