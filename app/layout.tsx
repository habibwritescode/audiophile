import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './ui/globals.css';
import Header from './ui/header';
import Footer from './ui/footer';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`flex min-h-screen flex-col ${manrope.variable} text-15 antialiased`}>
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
