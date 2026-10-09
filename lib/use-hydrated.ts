import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False in the server HTML and during hydration, true once React has taken over the page. Controls
 * that only work with JavaScript can render disabled until then, instead of ignoring early clicks.
 */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
