import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categories } from '@/lib/products';
import CategoryDetails from '@/ui/category-details/category-details';

type Props = { params: Promise<{ name: string }> };

export const generateStaticParams = () => categories.map((name) => ({ name }));

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { name } = await params;
  return { title: name.charAt(0).toUpperCase() + name.slice(1) };
};

const Page = async ({ params }: Props) => {
  const { name } = await params;

  if (!categories.includes(name)) notFound();

  return (
    <div>
      <CategoryDetails categoryName={name} />
    </div>
  );
};

export default Page;
