'use server';

import { checkCart } from '@/lib/cart-validation';

// Public endpoint: checkCart validates the input and only reads from the database
export const validateCart = async (lines: unknown) => checkCart(lines);
