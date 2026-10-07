import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// next/image needs Next's image loader, which doesn't exist under Vitest.
// Under Vite a static import is a URL string, while Next gives an object with `src`.
// The factory is hoisted above the rest of this file, so everything it uses lives inside it
vi.mock('next/image', () => {
  const nextOnlyImageProps = [
    'fill',
    'priority',
    'quality',
    'placeholder',
    'blurDataURL',
    'loader',
  ];

  return {
    default: ({ src, ...props }: { src: string | { src: string } } & Record<string, unknown>) =>
      createElement('img', {
        ...Object.fromEntries(
          Object.entries(props).filter(([key]) => !nextOnlyImageProps.includes(key))
        ),
        src: typeof src === 'string' ? src : src.src,
      }),
  };
});

// jsdom has no matchMedia; components that listen for breakpoints get a non-matching query
// Node-environment tests (database tests) have no window at all
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
