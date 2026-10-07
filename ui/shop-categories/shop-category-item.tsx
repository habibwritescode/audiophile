import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';

import arrowRight from '../../public/assets/shared/desktop/icon-arrow-right.svg';

type Props = {
  imgSrc: StaticImageData;
  categoryName: string;
  className: string;
  onClick?: () => void;
};

const ShopCategoryItem = ({ imgSrc, categoryName, className, onClick }: Props) => {
  return (
    <Link
      href={`/category/${categoryName.toLowerCase()}`}
      onClick={onClick}
      className={`group relative flex h-41.25 items-end justify-center rounded-lg bg-gray-100 pb-6 xl:h-51 ${className}`}
    >
      <Image
        alt=""
        src={imgSrc}
        className="absolute bottom-[55%] h-auto w-35 xl:w-40"
        quality={100}
      />

      <div className="grid place-items-center gap-4">
        <p className="text-15 font-bold text-black uppercase">{categoryName}</p>
        <div className="flex items-center gap-3">
          <p className="text-13 text-black/50 uppercase transition-colors group-hover:text-primary">
            Shop
          </p>

          <Image alt="" src={arrowRight} className="object-cover" />
        </div>
      </div>
    </Link>
  );
};

export default ShopCategoryItem;
