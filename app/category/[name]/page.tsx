import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categories, isCategory } from '@/lib/products';
import CategoryDetails from '@/ui/category-details/category-details';
import BringingYouTheBestGear from '@/ui/bringing-you-the-best';

type Props = { params: Promise<{ name: string }> };

// Every category is prerendered; the list is the schema's Category enum. No `dynamicParams =
// false`, as on product pages: revalidation needs it off. middleware.ts turns unknown names away.

export const generateStaticParams = () => categories.map((name) => ({ name }));

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { name } = await params;
  const title = name.charAt(0).toUpperCase() + name.slice(1);
  return {
    title,
    description: `Shop Audiophile ${name}: prices, stock and details for each model.`,
  };
};

const Page = async ({ params }: Props) => {
  const { name } = await params;

  if (!isCategory(name)) notFound();

  return (
    <div>
      <CategoryDetails categoryName={name} />
      <BringingYouTheBestGear />
    </div>
  );
};

export default Page;
