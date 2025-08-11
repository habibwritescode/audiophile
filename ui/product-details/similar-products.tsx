import { SimilarProduct } from '@/lib/types';
import Image from 'next/image';
import Button from '@/ui/button';
import Link from 'next/link';

const SimilarProducts = ({ products }: { products: SimilarProduct[] }) => {
  return (
    <div>
      <h3 className="mb-10 text-center text-24 text-black uppercase md:mb-14 md:text-32 xl:mb-16">
        You may also like
      </h3>

      <ul className="grid gap-14 md:grid-cols-3 md:gap-3 xl:gap-7.5">
        {products.map((product) => (
          <li key={product.slug} className="grid place-items-center">
            <Image
              alt=""
              src={product.image.mobile}
              width={327}
              height={120}
              className="sounded-lg w-full md:hidden"
            />
            <Image
              alt=""
              src={product.image.tablet}
              width={223}
              height={318}
              className="sounded-lg hidden w-full md:block xl:hidden"
            />
            <Image
              alt=""
              src={product.image.desktop}
              width={350}
              height={318}
              className="sounded-lg hidden w-full xl:block"
            />

            <p className="my-8 text-24 text-black md:mt-10">{product.name}</p>
            <Link href={`/product/${product.slug}`}>
              <Button>See Product</Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SimilarProducts;
