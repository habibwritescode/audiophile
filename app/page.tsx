import Hero from './ui/home/hero';
import ShopCategory from './ui/shop-categories/shop-categories';
import ProductsShowcase from './ui/home/products-showcase';

export default function Home() {
  return (
    <div>
      <Hero />
      <section className="px-6 pt-10 md:px-10">
        <div className="mx-auto max-w-6xl">
          <ShopCategory />
          <ProductsShowcase />
        </div>
      </section>
    </div>
  );
}
