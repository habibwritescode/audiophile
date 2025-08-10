import Image from 'next/image';
import Button from '@/ui/button';

import mobileHero from '../../public/assets/home/mobile/image-header.jpg';
import tabletHero from '../../public/assets/home/tablet/image-header.jpg';
import desktopHero from '../../public/assets/home/desktop/image-hero.jpg';

const Hero = () => {
  return (
    // calc => screen - header height
    <section className="relative min-h-[calc(100vh-90px)]">
      <Image
        src={mobileHero}
        alt=""
        fill
        quality={100}
        priority
        className="object-cover md:hidden"
      />
      <Image
        src={tabletHero}
        alt=""
        fill
        quality={100}
        priority
        className="hidden object-cover md:block xl:hidden"
      />

      <Image
        src={desktopHero}
        alt=""
        fill
        quality={100}
        priority
        className="hidden object-cover xl:block"
      />

      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col items-center justify-center xl:items-start">
        <p className="mb-4 text-14 text-white/50 md:mb-6">NEW PRODUCT</p>
        <p className="mb-6 max-w-80 text-center text-36 text-white uppercase md:max-w-99 md:text-56 xl:text-start">
          XX99 Mark II Headphones
        </p>
        <p className="mb-7 max-w-80 text-center text-15 text-white/75 md:mb-10 md:max-w-88 xl:text-start">
          Experience natural, lifelike audio and exceptional build quality made for the passionate
          music enthusiast.
        </p>
        <Button>See Product</Button>
      </div>
    </section>
  );
};

export default Hero;
