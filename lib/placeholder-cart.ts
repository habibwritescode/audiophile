// Temporary data for building the cart/checkout UI. Replace with real cart state.
export const placeholderCartItems = [
  {
    slug: 'xx99-mark-two-headphones',
    name: 'XX99 MK II',
    priceCents: 299900,
    quantity: 1,
    image: '/assets/cart/image-xx99-mark-two-headphones.jpg',
  },
  {
    slug: 'xx59-headphones',
    name: 'XX59',
    priceCents: 89900,
    quantity: 2,
    image: '/assets/cart/image-xx59-headphones.jpg',
  },
  {
    slug: 'yx1-earphones',
    name: 'YX1',
    priceCents: 59900,
    quantity: 1,
    image: '/assets/cart/image-yx1-earphones.jpg',
  },
];

export type CartItemData = (typeof placeholderCartItems)[number];
