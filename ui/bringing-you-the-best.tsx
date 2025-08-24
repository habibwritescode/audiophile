'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

import bestGearMobile from '../public/assets/shared/mobile/image-best-gear.jpg';
import bestGearTab from '../public/assets/shared/tablet/image-best-gear.jpg';
import bestGearDesktop from '../public/assets/shared/desktop/image-best-gear.jpg';
import { cn } from '@/lib/helpers';

const BringingYouTheBestGear = () => {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isCheckout = pathname === '/checkout';

  return (
    <section
      className={cn('my-30 px-6 md:px-10 xl:my-40', {
        'md:my-24 xl:my-50': isHome,
        hidden: isCheckout,
      })}
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:gap-16 xl:grid-cols-2 xl:gap-31">
        <div className="xl:order-2">
          <Image alt="" src={bestGearMobile} className="h-auto w-full rounded-lg md:hidden" />
          <Image
            alt=""
            src={bestGearTab}
            className="hidden h-auto w-full rounded-lg md:block xl:hidden"
          />
          <Image
            alt=""
            src={bestGearDesktop}
            className="hidden h-auto w-full rounded-lg xl:block"
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-8 text-center xl:order-1 xl:items-start xl:text-start">
          <p className="max-w-80 text-28 text-black uppercase md:max-w-143 md:text-40 xl:max-w-110">
            Bringing you the <span className="text-primary">best</span> audio gear
          </p>
          <p className="max-w-80 text-15 text-black/50 md:max-w-143 xl:max-w-110">
            Located at the heart of New York City, Audiophile is the premier store for high end
            headphones, earphones, speakers, and audio accessories. We have a large showroom and
            luxury demonstration rooms available for you to browse and experience a wide range of
            our products. Stop by our store to meet some of the fantastic people who make Audiophile
            the best place to buy your portable audio equipment.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BringingYouTheBestGear;
