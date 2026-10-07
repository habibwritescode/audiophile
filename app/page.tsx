import Hero from '@/ui/home/hero';
import ShopCategories from '@/ui/shop-categories/shop-categories';
import ProductsShowcase from '@/ui/home/products-showcase';
import BringingYouTheBestGear from '@/ui/bringing-you-the-best';

export default function Home() {
  return (
    <div>
      <Hero />
      <section className="px-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          <ShopCategories className="mt-10 md:my-24 xl:mt-30 xl:mb-42" />
          <ProductsShowcase />
        </div>
      </section>
      <BringingYouTheBestGear className="md:my-24 xl:my-50" />
    </div>
  );
}
