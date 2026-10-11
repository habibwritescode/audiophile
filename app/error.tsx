'use client';

import { useEffect } from 'react';
import Button, { ButtonLink } from '@/ui/button';

type Props = { error: Error & { digest?: string }; reset: () => void };

// Catches errors thrown while a page renders; the header and footer (root layout) stay usable
const ErrorPage = ({ error, reset }: Props) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-6 md:px-10">
      <section className="mx-auto flex max-w-6xl flex-col items-center py-24 text-center md:py-32">
        <p className="mb-4 text-14 text-primary">Error</p>
        <h1 className="mb-6 text-28 text-black uppercase md:text-40">Something went wrong</h1>
        <p className="mb-8 max-w-110 text-15 text-black/60">
          This page couldn&apos;t load. Try again, or head back home. Your cart is safe either way.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="secondary">
            Back to home
          </ButtonLink>
        </div>
        {/* Server errors carry a digest that matches the server log, without exposing details */}
        {error.digest && <p className="mt-8 text-13 text-black/60">Reference: {error.digest}</p>}
      </section>
    </div>
  );
};

export default ErrorPage;
