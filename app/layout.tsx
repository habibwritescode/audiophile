import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './ui/globals.css';

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
      <body className={`${manrope.variable} text-15 antialiased`}>{children}</body>
    </html>
  );
}
