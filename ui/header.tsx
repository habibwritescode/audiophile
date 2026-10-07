'use client';

import Image from 'next/image';
import NavLinks from './nav-links';
import Link from 'next/link';
import Cart from './cart/cart';
import { useState } from 'react';

const Header = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <header className="bg-neutral-dark md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between border-b border-b-white/20 px-6 py-8 md:justify-start md:gap-17 md:px-0 xl:gap-0 xl:py-9">
          <div className="xl:hidden">
            <Image
              src="/assets/shared/tablet/icon-hamburger.svg"
              width={16}
              height={15}
              alt="menu"
            />
          </div>
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
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
