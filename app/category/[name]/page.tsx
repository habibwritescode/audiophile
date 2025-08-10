import CategoryDetails from '@/app/ui/category-details/category-details';

const Page = async ({ params }: { params: Promise<{ name: string }> }) => {
  const { name } = await params;

  return (
    <div>
      <CategoryDetails categoryName={name} />
    </div>
  );
};

export default Page;
