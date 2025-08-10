import { Category } from '@/lib/types';
import Image from 'next/image';
import Button from '@/ui/button';

type Props = {
  data: Category;
  index: number;
};

const CategoryItem = ({ data, index }: Props) => {
  const isOddIndex = index % 2 !== 0;

  return (
    <div className="grid gap-8 md:gap-13 xl:grid-cols-2 xl:gap-31.25">
      <div className={isOddIndex ? 'xl:order-2' : ''}>
        <Image
          alt=""
          src={data.categoryImage.mobile}
          width={327}
          height={352}
          className="h-auto w-full rounded-lg md:hidden"
        />
        <Image
          alt=""
          src={data.categoryImage.tablet}
          width={689}
          height={352}
          className="hidden h-auto w-full rounded-lg md:block xl:hidden"
        />
        <Image
          alt=""
          src={data.categoryImage.mobile}
          width={540}
          height={560}
          className="hidden xl:block"
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
        <p className="mb-6 max-w-80 text-center text-black/50 md:max-w-143 xl:mb-10 xl:max-w-111.25 xl:text-start">
          {data.description}
        </p>
        <Button>See product</Button>
      </div>
    </div>
  );
};

export default CategoryItem;
