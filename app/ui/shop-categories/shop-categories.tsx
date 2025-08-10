import headphones from '../../../public/assets/shared/desktop/image-category-thumbnail-headphones.png';
import speakers from '../../../public/assets/shared/desktop/image-category-thumbnail-speakers.png';
import earphones from '../../../public/assets/shared/desktop/image-category-thumbnail-earphones.png';

import ShopCategoryItem from './shop-category-item';
import { cn } from '@/app/lib/helpers';

const ShopCategories = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        `my-30 grid gap-4 pt-10 sm:grid-cols-3 sm:gap-2.5 lg:gap-7.5 xl:my-40 ${className}`
      )}
    >
      <ShopCategoryItem className="mt-14 sm:mt-0" categoryName="Headphones" imgSrc={headphones} />
      <ShopCategoryItem className="mt-14 sm:mt-0" categoryName="Speakers" imgSrc={speakers} />
      <ShopCategoryItem className="mt-12 sm:mt-0" categoryName="Earphones" imgSrc={earphones} />
    </div>
  );
};

export default ShopCategories;
