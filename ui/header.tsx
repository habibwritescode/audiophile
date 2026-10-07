'use client';

import Image from 'next/image';
import NavLinks from './nav-links';
import Link from 'next/link';
import Cart from './cart/cart';
import Modal from './modal';
import ShopCategories from './shop-categories/shop-categories';
import { useEffect, useState } from 'react';
import { useCartHydrated, useCartStore } from '@/lib/cart-store';

// Total items (quantities added up), unlike the modal title, which counts products
const useCartItemCount = () => {
  const hydrated = useCartHydrated();
  const count = useCartStore((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0));
  return hydrated ? count : 0;
};

const Header = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const itemCount = useCartItemCount();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // The menu is mobile/tablet only; close it if the window grows to desktop width
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 80rem)');
    const closeOnDesktop = () => desktop.matches && setIsMenuOpen(false);
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <>
      <header className="bg-neutral-dark md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between border-b border-b-white/20 px-6 py-8 md:justify-start md:gap-17 md:px-0 xl:gap-0 xl:py-9">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="-m-2 p-2 xl:hidden"
          >
            <Image src="/assets/shared/tablet/icon-hamburger.svg" width={16} height={15} alt="" />
          </button>
          <Link href="/">
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
              itemCount
                ? `Open cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
                : 'Open cart'
            }
            onClick={() => setIsCartOpen((prev) => !prev)}
            className="relative -m-2 p-2 md:ml-auto"
          >
            <Image src="/assets/shared/desktop/icon-cart.svg" alt="" width={23} height={20} />
            {itemCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.625rem] leading-none font-bold text-white"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </header>
      <Modal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <div className="rounded-b-lg bg-white px-6 pt-8 pb-9 md:px-10 md:pt-14 md:pb-16">
          <ShopCategories className="my-0 pt-0" onItemClick={() => setIsMenuOpen(false)} />
        </div>
      </Modal>
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
