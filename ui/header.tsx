'use client';

import Image from 'next/image';
import NavLinks from './nav-links';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Cart from './cart/cart';
import MenuIcon from './menu-icon';
import Modal from './modal';
import ShopCategories from './shop-categories/shop-categories';
import { useEffect, useRef, useState } from 'react';
import { useCartModal } from '@/lib/cart-modal';
import { useCartHydrated, useCartStore } from '@/lib/cart-store';

// Total items (quantities added up), unlike the modal title, which counts products
const useCartItemCount = () => {
  const hydrated = useCartHydrated();
  const count = useCartStore((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0));
  return hydrated ? count : null;
};

/**
 * Bumps the badge when items are added, so the eye follows them to the cart. Not when the stored
 * cart loads (that's not an action), and not when items are removed.
 */
const useBadgeBump = (count: number | null) => {
  const badge = useRef<HTMLSpanElement>(null);
  const previous = useRef<number | null>(null);

  useEffect(() => {
    const before = previous.current;
    previous.current = count;
    if (before === null || count === null || count <= before) return;
    const el = badge.current;
    if (!el?.animate) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // WAAPI can't read var(): take the shared curve from the theme
    const easing = getComputedStyle(el).getPropertyValue('--ease-out').trim() || 'ease-out';
    // A second add mid-bump starts from the badge's current size instead of jumping back to 1
    const running = el.getAnimations();
    const current = getComputedStyle(el).transform;
    el.animate(
      reduceMotion
        ? [{ opacity: 0.5 }, { opacity: 1 }]
        : [
            { transform: current === 'none' ? 'scale(1)' : current },
            { transform: 'scale(1.2)', offset: 0.4 },
            { transform: 'scale(1)' },
          ],
      { duration: reduceMotion ? 150 : 250, easing }
    );
    running.forEach((animation) => animation.cancel());
  }, [count]);

  return badge;
};

const Header = () => {
  const isCartOpen = useCartModal((state) => state.isOpen);
  const setIsCartOpen = useCartModal((state) => state.setOpen);
  const storedCount = useCartItemCount();
  const itemCount = storedCount ?? 0;
  const badge = useBadgeBump(storedCount);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // The header lives in the root layout and outlives page changes: close the modals on navigation
  // (a header link, Back), or the cart would stay open over the new page
  const pathname = usePathname();
  const [modalsPathname, setModalsPathname] = useState(pathname);
  if (pathname !== modalsPathname) {
    setModalsPathname(pathname);
    setIsMenuOpen(false);
  }
  // The cart's state is shared (Add to Cart's "View cart" opens it), and a shared store can't be
  // updated while rendering, so it closes in an effect
  useEffect(() => setIsCartOpen(false), [pathname, setIsCartOpen]);

  // Headless UI counts the header as part of the dialog's tree, so a click on it isn't "outside"
  // and doesn't close the cart or menu. Do it here; each toggle button handles its own modal.
  const closeModalsOnHeaderClick = (event: React.MouseEvent) => {
    const toggle = (event.target as Element).closest('[data-modal-toggle]');
    const toggles = toggle?.getAttribute('data-modal-toggle');
    if (toggles !== 'cart') setIsCartOpen(false);
    if (toggles !== 'menu') setIsMenuOpen(false);
  };

  // The menu is mobile/tablet only; close it if the window grows to desktop width
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 80rem)');
    const closeOnDesktop = () => desktop.matches && setIsMenuOpen(false);
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <>
      <header className="bg-neutral-dark md:px-10" onClick={closeModalsOnHeaderClick}>
        <div className="mx-auto flex max-w-6xl items-center justify-between border-b border-b-white/20 px-6 py-8 md:justify-start md:gap-17 md:px-0 xl:gap-0 xl:py-9">
          <button
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            data-modal-toggle="menu"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="-m-2 p-2 transition-opacity active:opacity-60 xl:hidden"
          >
            <MenuIcon open={isMenuOpen} />
          </button>
          <Link href="/" className="transition-opacity active:opacity-60">
            <Image
              src="/assets/shared/desktop/logo.svg"
              alt="Audiophile home"
              width={143}
              height={25}
            />
          </Link>

          <div className="ml-50 hidden xl:block">
            <NavLinks />
          </div>

          <button
            type="button"
            aria-label={
              isCartOpen
                ? 'Close cart'
                : itemCount
                  ? `Open cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
                  : 'Open cart'
            }
            aria-expanded={isCartOpen}
            data-modal-toggle="cart"
            onClick={() => setIsCartOpen((prev) => !prev)}
            className="relative -m-2 p-2 transition-opacity active:opacity-60 md:ml-auto"
          >
            <Image src="/assets/shared/desktop/icon-cart.svg" alt="" width={23} height={20} />
            {itemCount > 0 && (
              <span
                ref={badge}
                aria-hidden="true"
                className="absolute -top-1 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.625rem] leading-none font-bold text-white"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </header>
      <Modal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        panelClassName="rounded-b-lg bg-white px-6 pt-8 pb-9 md:px-10 md:pt-14 md:pb-16"
      >
        <ShopCategories className="my-0 pt-0" onItemClick={() => setIsMenuOpen(false)} />
      </Modal>
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
