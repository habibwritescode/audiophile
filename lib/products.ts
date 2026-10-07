import data from './data.json';
import { Product } from './types';

// Temporary until products are read from the database, which stores cents
const products: Product[] = data.map(({ price, ...product }) => ({
  ...product,
  priceCents: price * 100,
}));

export const categories = [...new Set(products.map((product) => product.category))];

export const getAllProducts = () => products;

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);

export const getProductsByCategory = (category: string) =>
  products.filter((product) => product.category === category);
