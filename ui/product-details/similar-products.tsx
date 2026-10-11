import { SimilarProduct } from '@/lib/types';
import ArtDirectedImage from '@/ui/art-directed-image';
import { ButtonLink } from '@/ui/button';

const SimilarProducts = ({ products }: { products: SimilarProduct[] }) => {
  return (
    <div>
      <h2 className="mb-10 text-center text-24 text-black uppercase md:mb-14 md:text-32 xl:mb-16">
        You may also like
      </h2>

      <ul className="grid gap-14 md:grid-cols-3 md:gap-3 xl:gap-7.5">
        {products.map((product) => (
          <li key={product.slug} className="grid place-items-center">
            <ArtDirectedImage
              mobile={{ src: product.image.mobile, width: 327, height: 120 }}
              tablet={{ src: product.image.tablet, width: 223, height: 318 }}
              desktop={{ src: product.image.desktop, width: 350, height: 318 }}
              sizes="(min-width: 80rem) 350px, (min-width: 48rem) calc((100vw - 104px) / 3), calc(100vw - 48px)"
              className="h-auto w-full rounded-lg"
            />

            <p className="my-8 text-24 text-black md:mt-10">{product.name}</p>
            <ButtonLink href={`/product/${product.slug}`}>See Product</ButtonLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SimilarProducts;
