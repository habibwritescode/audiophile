import ArtDirectedImage from '../art-directed-image';
import { ButtonLink } from '@/ui/button';

import mobileHero from '../../public/assets/home/mobile/image-header.jpg';
import tabletHero from '../../public/assets/home/tablet/image-header.jpg';
import desktopHero from '../../public/assets/home/desktop/image-hero.jpg';

const Hero = () => {
  return (
    <section className="relative min-h-[calc(100svh-var(--header-height))]">
      <ArtDirectedImage
        mobile={mobileHero}
        tablet={tabletHero}
        desktop={desktopHero}
        sizes="100vw"
        fill
        priority
        className="object-cover"
      />

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
