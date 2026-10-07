import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categories, isCategory } from '@/lib/products';
import CategoryDetails from '@/ui/category-details/category-details';
import BringingYouTheBestGear from '@/ui/bringing-you-the-best';

type Props = { params: Promise<{ name: string }> };

// Every category is prerendered; the list is the schema's Category enum. Unknown paths 404
// without rendering on demand.
export const dynamicParams = false;

export const generateStaticParams = () => categories.map((name) => ({ name }));

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { name } = await params;
  return { title: name.charAt(0).toUpperCase() + name.slice(1) };
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
