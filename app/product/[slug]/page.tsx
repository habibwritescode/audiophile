import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllProductSlugs, getProduct } from '@/lib/products';
import ProductDetails from '@/ui/product-details/product-details';
import BringingYouTheBestGear from '@/ui/bringing-you-the-best';

type Props = { params: Promise<{ slug: string }> };

// Every product is prerendered, and the list only changes on deploy (the seed runs before the
// build). Unknown paths 404 without rendering on demand, so they never reach the database.
export const dynamicParams = false;

export const generateStaticParams = async () =>
  (await getAllProductSlugs()).map((slug) => ({ slug }));

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  return { title: (await getProduct(slug))?.name };
};

const Page = async ({ params }: Props) => {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return (
    <div>
      <ProductDetails product={product} />
      <BringingYouTheBestGear />
    </div>
  );
};

export default Page;
