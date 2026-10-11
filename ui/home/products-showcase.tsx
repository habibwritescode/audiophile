import ArtDirectedImage from '../art-directed-image';

import zx9SpeakerMobile from '../../public/assets/home/mobile/image-speaker-zx9.png';
import zx9SpeakerTab from '../../public/assets/home/tablet/image-speaker-zx9.png';
import zx9SpeakerDesktop from '../../public/assets/home/desktop/image-speaker-zx9.png';

import zx7SpeakerMobile from '../../public/assets/home/mobile/image-speaker-zx7.jpg';
import zx7SpeakerTab from '../../public/assets/home/tablet/image-speaker-zx7.jpg';
import zx7SpeakerDesktop from '../../public/assets/home/desktop/image-speaker-zx7.jpg';

import earphonesMobile from '../../public/assets/home/mobile/image-earphones-yx1.jpg';
import earphonesTab from '../../public/assets/home/tablet/image-earphones-yx1.jpg';
import earphonesDesktop from '../../public/assets/home/desktop/image-earphones-yx1.jpg';

import { ButtonLink } from '../button';

const ProductsShowcase = () => {
  return (
    <div className="grid gap-6 md:gap-8 xl:gap-12">
      <div className="grid place-items-center gap-9 overflow-hidden rounded-lg bg-primary bg-[url('/assets/home/desktop/pattern-circles.svg')] bg-cover bg-[50%_-130px] bg-no-repeat px-6 py-14 md:gap-16 md:bg-auto md:bg-[50%_-280px] md:pb-16 xl:grid-cols-2 xl:bg-[-120px_0px] xl:pl-30">
        <ArtDirectedImage
          mobile={zx9SpeakerMobile}
          tablet={zx9SpeakerTab}
          desktop={zx9SpeakerDesktop}
          sizes="(min-width: 80rem) 400px, (min-width: 48rem) 200px, 160px"
          className="relative h-auto w-40 md:w-50 xl:top-19 xl:w-100"
        />

        <div className="grid place-items-center gap-6 text-center xl:place-items-start xl:text-start">
          <h2 className="text-36 text-white md:text-56">
            <span className="block">ZX9</span> <span className="block">SPEAKER</span>
          </h2>
          <p className="max-w-70 text-15 text-white md:mb-4 xl:max-w-88">
            Upgrade to premium speakers that are phenomenally built to deliver truly remarkable
            sound.
          </p>
          <ButtonLink href="/product/zx9-speaker" variant="dark">
            See Product
          </ButtonLink>
        </div>
      </div>
      {/* // ZX7 */}
      <div className="relative">
        <ArtDirectedImage
          mobile={zx7SpeakerMobile}
          tablet={zx7SpeakerTab}
          desktop={zx7SpeakerDesktop}
          sizes="(min-width: 80rem) 1152px, (min-width: 48rem) calc(100vw - 80px), calc(100vw - 48px)"
          className="h-auto w-full rounded-lg"
        />

        <div className="absolute top-1/2 left-6 flex -translate-y-1/2 flex-col gap-8 md:left-15">
          <h2 className="text-28 text-black">ZX7 SPEAKER</h2>
          <ButtonLink href="/product/zx7-speaker" variant="secondary">
            See Product
          </ButtonLink>
        </div>
      </div>

      {/* EARPHONES  */}
      <div className="grid w-full gap-6 md:grid-cols-2 md:gap-3 xl:gap-8">
        <div>
          <ArtDirectedImage
            mobile={earphonesMobile}
            tablet={earphonesTab}
            desktop={earphonesDesktop}
            sizes="(min-width: 80rem) 560px, (min-width: 48rem) calc(50vw - 46px), calc(100vw - 48px)"
            className="h-auto w-full rounded-lg"
          />
        </div>

        <div className="flex flex-col justify-center gap-8 rounded-lg bg-gray-100 px-6 py-10 md:left-15 md:pl-10 xl:pl-24">
          <h2 className="text-28 text-black">YX1 EARPHONES</h2>
          <ButtonLink href="/product/yx1-earphones" variant="secondary">
            See Product
          </ButtonLink>
        </div>
      </div>
    </div>
  );
};

export default ProductsShowcase;
