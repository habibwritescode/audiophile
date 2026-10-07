import headphones from '../../public/assets/shared/desktop/image-category-thumbnail-headphones.png';
import speakers from '../../public/assets/shared/desktop/image-category-thumbnail-speakers.png';
import earphones from '../../public/assets/shared/desktop/image-category-thumbnail-earphones.png';

import ShopCategoryItem from './shop-category-item';
import { cn } from '@/lib/helpers';

type Props = {
  className?: string;
  onItemClick?: () => void;
};

const ShopCategories = ({ className, onItemClick }: Props) => {
  return (
    <div
      className={cn(
        `my-30 grid gap-4 pt-10 sm:grid-cols-3 sm:gap-2.5 lg:gap-7.5 xl:my-40 ${className}`
      )}
    >
      <ShopCategoryItem
        className="mt-14 sm:mt-0"
        categoryName="Headphones"
        imgSrc={headphones}
        onClick={onItemClick}
      />
      <ShopCategoryItem
        className="mt-14 sm:mt-0"
        categoryName="Speakers"
        imgSrc={speakers}
        onClick={onItemClick}
      />
      <ShopCategoryItem
        className="mt-12 sm:mt-0"
        categoryName="Earphones"
        imgSrc={earphones}
        onClick={onItemClick}
      />
    </div>
  );
};

export default ShopCategories;
