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

  description: 'Audiophile ecommerce app',
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
        <CartHydration />
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        {DevDataToggle && <DevDataToggle />}
      </body>
    </html>
  );
}
