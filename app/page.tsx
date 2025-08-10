import Hero from '@/ui/home/hero';
import ShopCategories from '@/ui/shop-categories/shop-categories';
import ProductsShowcase from '@/ui/home/products-showcase';

// import { headers } from 'next/headers';
// import type { Metadata } from 'next';
// import { Metadata } from 'next';

// const META_TITLE_MAP: Record<string, string> = {
//   'audiophile-ochre.vercel.app': "Habib's Audiophile",
//   here: 'test failed2',
// };

// export async function generateMetadata(): Promise<Metadata> {
//   const allHeaders = await headers();
//   const host = allHeaders.get('host');

//   const baseHostname = host?.replace(/^www\./, '') || 'here';
//   console.log('baseHostName', baseHostname);
//   const title = META_TITLE_MAP[baseHostname] || 'Test failed';

//   return {
//     title,
//     description: `${title} - Welcome to hell`,
// openGraph: {
// title: `${title} - opengraph`,
// description: 'Open Graph description.',
// url: 'https://your-site.com',
// images: ['https://your-site.com/og-image.jpg'],
// },
// twitter: {
//   card: 'summary_large_image',
//   title: `${title} - twitter`,
//   description: 'Twitter card description.',
//   // images: ['https://your-site.com/og-image.jpg'],
// },
// openGraph: {
//   title,
//   description: '',
//   url: `https://${host}`,
//   siteName: title,
//   images: [`https://${host}/og-image.png`],
//   type: 'website',
// },
//   };
// }

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
    </div>
  );
}
