import { IProductGallery } from '@/lib/types';
import Image from 'next/image';

const ProductGallery = ({ gallery }: { gallery: IProductGallery }) => {
  return (
    <div>
      <div className="grid gap-5 md:hidden">
        <Image
          src={gallery.first.mobile}
          alt=""
          width={327}
          height={174}
          className="w-full rounded-lg"
        />
        <Image
          src={gallery.second.mobile}
          alt=""
          width={327}
          height={174}
          className="w-full rounded-lg"
        />
        <Image
          src={gallery.third.mobile}
          alt=""
          width={327}
          height={368}
          className="w-full rounded-lg"
        />
      </div>

      <div className="hidden grid-cols-[40%_1fr] gap-5 md:grid xl:hidden">
        <div className="grid gap-5">
          <Image
            src={gallery.first.tablet}
            alt=""
            width={277}
            height={174}
            className="w-full rounded-lg"
          />
          <Image
            src={gallery.second.tablet}
            alt=""
            width={277}
            height={174}
            className="w-full rounded-lg"
          />
        </div>
        <Image
          src={gallery.third.tablet}
          alt=""
          width={395}
          height={368}
          className="w-full rounded-lg"
        />
      </div>

      <div className="hidden grid-cols-[40%_1fr] gap-5 xl:grid">
        <div className="grid gap-5">
          <Image
            src={gallery.first.desktop}
            alt=""
            width={445}
            height={280}
            className="rounded-lg"
          />
          <Image
            src={gallery.second.desktop}
            alt=""
            width={445}
            height={280}
            className="rounded-lg"
          />
        </div>
        <Image src={gallery.third.desktop} alt="" width={635} height={592} className="rounded-lg" />
      </div>
    </div>
  );
};

export default ProductGallery;
