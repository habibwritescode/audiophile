import React from 'react';

import headphones from '../../../public/assets/shared/desktop/image-category-thumbnail-headphones.png';
import speakers from '../../../public/assets/shared/desktop/image-category-thumbnail-speakers.png';
import earphones from '../../../public/assets/shared/desktop/image-category-thumbnail-earphones.png';

import ShopCategoryItem from './shop-category-item';

const ShopCategory = () => {
  return (
    <div className="mb-30 grid gap-4 sm:my-25 sm:grid-cols-3 sm:gap-2.5 lg:mt-30 lg:mb-42 lg:gap-7.5">
      <ShopCategoryItem className="mt-14 sm:mt-0" categoryName="Headphones" imgSrc={headphones} />
      <ShopCategoryItem className="mt-14 sm:mt-0" categoryName="Speakers" imgSrc={speakers} />
      <ShopCategoryItem className="mt-12 sm:mt-0" categoryName="Earphones" imgSrc={earphones} />
    </div>
  );
};

export default ShopCategory;
