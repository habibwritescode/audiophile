import data from '@/app/lib/data.json';
import CategoryItem from './category-item';
import ShopCategories from '../shop-categories/shop-categories';

type Props = {
  categoryName: string;
};

const CategoryDetails = ({ categoryName }: Props) => {
  const categoryItems = data.filter((item) => item.category === categoryName);

  return (
    <div>
      <div className="grid place-items-center bg-neutral-dark py-8 md:py-25">
        <h1 className="text-28 text-white uppercase md:text-40">{categoryName}</h1>
      </div>

      <section className="px-6 pt-16 md:px-10 md:pt-30 xl:pt-40">
        <section className="mx-auto max-w-6xl">
          <ul className="grid gap-30 xl:gap-40">
            {categoryItems.map((item, index) => (
              <CategoryItem key={item.slug} index={index} data={item} />
            ))}
          </ul>
          <ShopCategories />
        </section>
      </section>
    </div>
  );
};

export default CategoryDetails;
