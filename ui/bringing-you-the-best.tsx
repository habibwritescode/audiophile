import ArtDirectedImage from './art-directed-image';

import bestGearMobile from '../public/assets/shared/mobile/image-best-gear.jpg';
import bestGearTab from '../public/assets/shared/tablet/image-best-gear.jpg';
import bestGearDesktop from '../public/assets/shared/desktop/image-best-gear.jpg';
import { cn } from '@/lib/helpers';

const BringingYouTheBestGear = ({ className }: { className?: string }) => {
  return (
    <section className={cn('my-30 px-6 md:px-10 xl:my-40', className)}>
      <div className="mx-auto grid max-w-6xl gap-10 md:gap-16 xl:grid-cols-2 xl:gap-31">
        <div className="xl:order-2">
          <ArtDirectedImage
            mobile={bestGearMobile}
            tablet={bestGearTab}
            desktop={bestGearDesktop}
            sizes="(min-width: 80rem) 540px, (min-width: 48rem) calc(100vw - 80px), calc(100vw - 48px)"
            className="h-auto w-full rounded-lg"
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-8 text-center xl:order-1 xl:items-start xl:text-start">
          <h2 className="max-w-80 text-28 text-black uppercase md:max-w-143 md:text-40 xl:max-w-110">
            Bringing you the <span className="text-primary">best</span> audio gear
          </h2>
          <p className="max-w-80 text-15 text-black/60 md:max-w-143 xl:max-w-110">
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
