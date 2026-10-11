import type { SetStateAction } from 'react';
import { create } from 'zustand';

/**
 * Whether the cart modal is open. The header renders the modal; other components (Add to Cart's
 * "View cart") open it too.
 */
export const useCartModal = create<{
  isOpen: boolean;
  setOpen: (open: SetStateAction<boolean>) => void;
}>()((set) => ({
  isOpen: false,
  setOpen: (open) =>
    set((state) => ({ isOpen: typeof open === 'function' ? open(state.isOpen) : open })),
}));
