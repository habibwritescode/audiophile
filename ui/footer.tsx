import Image from 'next/image';
import Link from 'next/link';
import NavLinks from './nav-links';

const Footer = () => {
  return (
    <footer className="bg-neutral-dark px-6 pb-10 md:px-10 md:pb-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center md:items-start">
        <div className="mb-12 h-1 w-25 bg-primary md:mb-14 xl:mb-18" />

        <div className="flex flex-col gap-12 md:gap-8 xl:w-full xl:flex-row xl:items-center xl:justify-between">
          <Link href="/" className="transition-opacity active:opacity-60">
            <Image
              src="/assets/shared/desktop/logo.svg"
              alt="Audiophile home"
              width={143}
              height={25}
            />
          </Link>
          <NavLinks />
        </div>

        <div className="my-12 md:mt-8 md:mb-20 xl:mt-9 xl:flex xl:w-full xl:justify-between">
          <p className="max-w-80 text-center text-15 text-white/50 md:max-w-2xl md:text-start xl:max-w-135">
            Audiophile is an all in one stop to fulfill your audio needs. We&apos;re a small team of
            music lovers and sound specialists who are devoted to helping you get the most out of
            personal audio. Come and visit our demo facility - we’re open 7 days a week.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-12 md:flex-row md:justify-between">
          {/* Rendered at build, so it follows the year of the latest deploy */}
          <p className="text-15 text-white/50">
            Copyright {new Date().getFullYear()}. All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
