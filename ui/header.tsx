'use client';

import Image from 'next/image';
import NavLinks from './nav-links';
import Link from 'next/link';
import Cart from './cart/cart';
import Modal from './modal';
import ShopCategories from './shop-categories/shop-categories';
import { useState } from 'react';

const Header = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <Image src="/assets/shared/desktop/logo.svg" alt="logo" width={143} height={25} />
          </Link>

          <div className="ml-50 hidden xl:block">
            <NavLinks />
          </div>

          <button
            type="button"
            aria-label="Open cart"
            onClick={() => setIsCartOpen((prev) => !prev)}
            className="-m-2 p-2 md:ml-auto"
          >
            <Image src="/assets/shared/desktop/icon-cart.svg" alt="" width={23} height={20} />
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
