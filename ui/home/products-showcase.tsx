import Image from 'next/image';

import zx9SpeakerMobile from '../../public/assets/home/mobile/image-speaker-zx9.png';
import zx9SpeakerTab from '../../public/assets/home/tablet/image-speaker-zx9.png';
import zx9SpeakerDesktop from '../../public/assets/home/desktop/image-speaker-zx9.png';

import zx7SpeakerMobile from '../../public/assets/home/mobile/image-speaker-zx7.jpg';
import zx7SpeakerTab from '../../public/assets/home/tablet/image-speaker-zx7.jpg';
import zx7SpeakerDesktop from '../../public/assets/home/desktop/image-speaker-zx7.jpg';

import earphonesMobile from '../../public/assets/home/mobile/image-earphones-yx1.jpg';
import earphonesTab from '../../public/assets/home/tablet/image-earphones-yx1.jpg';
import earphonesDesktop from '../../public/assets/home/desktop/image-earphones-yx1.jpg';

import Button from '../button';

const ProductsShowcase = () => {
  return (
    <div className="grid gap-6 md:gap-8 xl:gap-12">
      <div className="grid place-items-center gap-9 overflow-hidden rounded-lg bg-primary bg-[url('/assets/home/desktop/pattern-circles.svg')] bg-cover bg-[50%_-130px] bg-no-repeat px-6 py-14 md:gap-16 md:bg-auto md:bg-[50%_-280px] md:pb-16 xl:grid-cols-2 xl:bg-[-120px_0px] xl:pl-30">
        <Image alt="" src={zx9SpeakerMobile} className="h-auto w-40 md:hidden" quality={100} />
        <Image alt="" src={zx9SpeakerTab} className="hidden h-auto w-50 md:block xl:hidden" />
        <Image
          alt=""
          src={zx9SpeakerDesktop}
          className="relative top-19 hidden h-auto w-100 xl:block"
        />

        <div className="grid place-items-center gap-6 text-center xl:place-items-start xl:text-start">
          <div>
            <p className="text-36 text-white md:text-56">ZX9</p>
            <p className="text-36 text-white md:text-56"> SPEAKER</p>
          </div>
          <p className="max-w-70 text-15 text-white/75 md:mb-4 xl:max-w-88">
            Upgrade to premium speakers that are phenomenally built to deliver truly remarkable
            sound.
          </p>
          <Button variant="dark"> See Product</Button>
        </div>
      </div>
      {/* // ZX7 */}
      <div className="relative">
        <Image alt="" src={zx7SpeakerMobile} className="h-auto w-full rounded-lg md:hidden" />
        <Image
          alt=""
          src={zx7SpeakerTab}
          className="hidden h-auto w-full rounded-lg md:block xl:hidden"
        />
        <Image
          alt=""
          src={zx7SpeakerDesktop}
          className="hidden h-auto w-full rounded-lg xl:block"
        />

        <div className="absolute top-1/2 left-6 flex -translate-y-1/2 flex-col gap-8 md:left-15">
          <p className="text-28">ZX7 SPEAKER</p>
          <div>
            <Button variant="secondary">See Product</Button>
          </div>
        </div>
      </div>

      {/* EARPHONES  */}
      <div className="grid w-full gap-6 md:grid-cols-2 md:gap-3 xl:gap-8">
        <div>
          <Image alt="" src={earphonesMobile} className="h-auto w-full rounded-lg md:hidden" />
          <Image
            alt=""
            src={earphonesTab}
            className="hidden h-auto w-full rounded-lg md:block xl:hidden"
          />
          <Image
            alt=""
            src={earphonesDesktop}
            className="hidden h-auto w-full rounded-lg xl:block"
          />
        </div>

        <div className="flex flex-col justify-center gap-8 rounded-lg bg-gray-100 px-6 py-10 md:left-15 md:pl-10 xl:pl-24">
          <p className="text-28">YX1 EARPHONES</p>
          <div>
            <Button variant="secondary">See Product</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsShowcase;
