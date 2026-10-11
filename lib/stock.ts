/** At or below this many left, pages warn that stock is low */
export const LOW_STOCK_THRESHOLD = 5;

/** What product pages say about stock; null when there's plenty */
export const stockLabel = (stock: number) => {
  if (stock <= 0) return 'Sold out';
  if (stock <= LOW_STOCK_THRESHOLD) return `Only ${stock} left`;
  return null;
};
