'use client';

import { useEffect } from 'react';
import { Manrope } from 'next/font/google';
import '@/ui/globals.css';

// The root layout (which loads the font) is what failed, so load it here too
const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });

type Props = { error: Error & { digest?: string }; reset: () => void };

// Only when the root layout itself fails: it replaces the whole document, header and footer
// included, so it renders its own <html> and stays minimal
const GlobalError = ({ error, reset }: Props) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        className={`${manrope.variable} flex min-h-svh flex-col items-center justify-center gap-6 bg-white px-6 text-center font-sans`}
      >
        <h1 className="text-28 text-black uppercase">Something went wrong</h1>
        <p className="max-w-110 text-15 text-black/60">
          The store couldn&apos;t load. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={reset}
          className="h-12 bg-primary px-8 text-13 text-white uppercase hover:bg-primary-dark"
        >
          Try again
        </button>
        {error.digest && <p className="text-13 text-black/60">Reference: {error.digest}</p>}
      </body>
    </html>
  );
};

export default GlobalError;
