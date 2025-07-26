import Image from 'next/image';
import NavLinks from './nav-links';

const Header = () => {
  return (
    <header className="px-6 md:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between border-b border-b-[#979797] py-8 md:justify-start md:gap-[4.2rem] xl:gap-0 xl:py-9">
        <div className="xl:hidden">
          <Image src="/assets/shared/tablet/icon-hamburger.svg" width={16} height={15} alt="menu" />
        </div>
        <Image src="/assets/shared/desktop/logo.svg" alt="logo" width={143} height={25} />

        <div className="ml-50 hidden xl:block">
          <NavLinks />
        </div>

        <Image
          src="/assets/shared/desktop/icon-cart.svg"
          className="md:ml-auto"
          alt="cart"
          width={23}
          height={20}
        />
      </div>
    </header>
  );
};

export default Header;
