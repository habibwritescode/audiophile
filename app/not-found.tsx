import type { Metadata } from 'next';
import { ButtonLink } from '@/ui/button';
import ShopCategories from '@/ui/shop-categories/shop-categories';

export const metadata: Metadata = { title: 'Page not found' };

// Unknown product and category URLs land here too (middleware.ts rewrites them to a 404)
const NotFound = () => {
  return (
    <div className="px-6 md:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="flex flex-col items-center pt-16 text-center md:pt-24 xl:pt-30">
          <p className="mb-4 text-14 text-primary">404</p>
          <h1 className="mb-6 text-28 text-black uppercase md:text-40">Page not found</h1>
          <p className="mb-8 max-w-110 text-15 text-black/60">
            That page doesn&apos;t exist, or the product is no longer in the store. Have a look
            around instead.
          </p>
          <ButtonLink href="/">Back to home</ButtonLink>
        </section>
        <ShopCategories />
      </div>
    </div>
  );
};

export default NotFound;
