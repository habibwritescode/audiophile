import ArtDirectedImage from '../art-directed-image';
import { ButtonLink } from '@/ui/button';

import mobileHero from '../../public/assets/home/mobile/image-header.jpg';
import tabletHero from '../../public/assets/home/tablet/image-header.jpg';
import desktopHero from '../../public/assets/home/desktop/image-hero.jpg';

const Hero = () => {
  return (
    // The photo's own edge colour: until it paints, the overlay below would otherwise darken the white
    // page into a grey block, and on wide screens the photo sits on it without a seam.
    // From 1280px the hero stops at the desktop photo's size (1440×729), so it's never stretched
    // past its pixels (it was 1.84× on a 2560×1440 screen); the photo is centred on the background.
    <section className="relative min-h-[calc(100svh-var(--header-height))] bg-hero xl:h-[min(calc(100svh-var(--header-height)),729px)] xl:min-h-0">
      <div className="absolute inset-y-0 left-1/2 w-full -translate-x-1/2 xl:max-w-[1440px]">
        <ArtDirectedImage
          mobile={mobileHero}
          tablet={tabletHero}
          desktop={desktopHero}
          sizes="(min-width: 90rem) 1440px, 100vw"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col items-center justify-center xl:items-start">
        <p className="mb-4 text-14 text-white/50 md:mb-6">NEW PRODUCT</p>
        <h1 className="mb-6 max-w-80 text-center text-36 text-white uppercase md:max-w-99 md:text-56 xl:text-start">
          XX99 Mark II Headphones
        </h1>
        <p className="mb-7 max-w-80 text-center text-15 text-white/75 md:mb-10 md:max-w-88 xl:text-start">
          Experience natural, lifelike audio and exceptional build quality made for the passionate
          music enthusiast.
        </p>
        <ButtonLink href="/product/xx99-mark-two-headphones">See Product</ButtonLink>
      </div>
    </section>
  );
};

export default Hero;
