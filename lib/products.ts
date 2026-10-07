import data from './data.json';
import { Product } from './types';

const products: Product[] = data;

export const categories = [...new Set(products.map((product) => product.category))];

export const getAllProducts = () => products;

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);

export const getProductsByCategory = (category: string) =>
  products.filter((product) => product.category === category);
