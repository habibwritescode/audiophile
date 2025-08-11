import ProductDetails from '@/ui/product-details/product-details';

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  return (
    <div>
      <ProductDetails slug={slug} />
    </div>
  );
};

export default Page;
