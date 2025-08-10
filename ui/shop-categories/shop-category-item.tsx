import Image, { StaticImageData } from 'next/image';
import React from 'react';

import arrowRight from '../../public/assets/shared/desktop/icon-arrow-right.svg';

type Props = {
  imgSrc: StaticImageData;
  categoryName: string;
  className: string;
};

const ShopCategoryItem = ({ imgSrc, categoryName, className }: Props) => {
  return (
    <div
      className={`relative flex h-41.25 items-end justify-center rounded-lg bg-gray-100 pb-6 xl:h-51 ${className}`}
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
          <p className="text-13 text-black/50 uppercase">Shop</p>

          <Image alt="" src={arrowRight} className="object-cover" />
        </div>
      </div>
    </div>
  );
};

export default ShopCategoryItem;
