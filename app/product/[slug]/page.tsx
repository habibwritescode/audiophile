import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllProducts, getProduct } from '@/lib/products';
import ProductDetails from '@/ui/product-details/product-details';

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () =>
  getAllProducts().map((product) => ({ slug: product.slug }));

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  return { title: getProduct(slug)?.name };
};

const Page = async ({ params }: Props) => {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) notFound();

  return (
    <div>
      <ProductDetails product={product} />
    </div>
  );
};

export default Page;
