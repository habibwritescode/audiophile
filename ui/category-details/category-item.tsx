import { Product } from '@/lib/types';
import ArtDirectedImage from '@/ui/art-directed-image';
import { ButtonLink } from '@/ui/button';
import StockLabel from '@/ui/stock-label';

type Props = {
  data: Product;
  index: number;
};

const CategoryItem = ({ data, index }: Props) => {
  const isOddIndex = index % 2 !== 0;

  return (
    <li className="grid gap-8 md:gap-13 xl:grid-cols-2 xl:gap-31.25">
      <div className={isOddIndex ? 'xl:order-2' : ''}>
        {/* The first product is the page's largest image: it loads first, the rest lazily */}
        <ArtDirectedImage
          mobile={{ src: data.categoryImage.mobile, width: 327, height: 352 }}
          tablet={{ src: data.categoryImage.tablet, width: 689, height: 352 }}
          desktop={{ src: data.categoryImage.desktop, width: 540, height: 560 }}
          sizes="(min-width: 80rem) 540px, (min-width: 48rem) calc(100vw - 80px), calc(100vw - 48px)"
          priority={index === 0}
          className="h-auto w-full rounded-lg"
        />
      </div>

      <div
        className={`${isOddIndex ? 'xl:order-1' : ''} flex flex-col items-center justify-center xl:items-start`}
      >
        {data.new ? (
          <p className="mb-6 text-14 text-primary uppercase md:mb-4"> New Product</p>
        ) : null}
        <h2 className="mb-6 max-w-75 text-center text-28 text-black uppercase md:mb-8 md:text-40 xl:text-start">
          {data.name}
        </h2>
        <p className="mb-6 max-w-80 text-center text-15 text-black/50 md:max-w-143 xl:mb-10 xl:max-w-111.25 xl:text-start">
          {data.description}
        </p>
        <StockLabel stock={data.stock} className="mb-6" />
        <ButtonLink href={`/product/${data.slug}`}>See product</ButtonLink>
      </div>
    </li>
  );
};

export default CategoryItem;
