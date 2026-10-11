import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllProductSlugs, getProduct } from '@/lib/products';
import ProductDetails from '@/ui/product-details/product-details';
import BringingYouTheBestGear from '@/ui/bringing-you-the-best';

type Props = { params: Promise<{ slug: string }> };

// Every product is prerendered, and stock changes regenerate pages on demand (revalidatePath).
// No `dynamicParams = false`: in Next 15.5 a revalidated page on such a route answers 404
// (NoFallbackError). Unknown slugs are turned away by middleware.ts before reaching this route.

export const generateStaticParams = async () =>
  (await getAllProductSlugs()).map((slug) => ({ slug }));

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product?.name, description: product?.description };
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
