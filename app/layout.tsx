import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import dynamic from 'next/dynamic';
import '@/ui/globals.css';
import Header from '@/ui/header';
import Footer from '@/ui/footer';
import CartHydration from '@/ui/cart/cart-hydration';

// Dev-only worst-case data toggle. Imported only in a branch that's dead in production builds, so
// it isn't bundled at all (a static import would ship it, gated or not).
const DevDataToggle =
  process.env.NODE_ENV === 'development' ? dynamic(() => import('@/ui/dev/data-toggle')) : null;

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Audiophile',
    default: 'Audiophile',
  },

  description:
    'Premium headphones, speakers and earphones, chosen by music lovers and sound specialists.',
};

// The status bar and browser chrome match the header, which is dark in every colour scheme. The
// site has no dark mode, so form controls stay light too.
export const viewport: Viewport = {
  themeColor: '#101010',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`flex min-h-svh flex-col bg-white ${manrope.variable} text-15 antialiased`}>
        {/* First Tab stop: keyboard users skip the header's controls on every page */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-15 focus:text-black"
        >
          Skip to content
        </a>
        <CartHydration />
        <Header />
        <main id="main" tabIndex={-1} className="flex-grow outline-none">
          {children}
        </main>
        <Footer />
        {DevDataToggle && <DevDataToggle />}
      </body>
    </html>
  );
}
