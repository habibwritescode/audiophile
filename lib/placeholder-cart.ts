// Temporary data for building the cart/checkout UI. Replace with real cart state.
export const placeholderCartItems = [
  {
    slug: 'xx99-mark-two-headphones',
    name: 'XX99 MK II',
    price: 2999,
    quantity: 1,
    image: '/assets/cart/image-xx99-mark-two-headphones.jpg',
  },
  {
    slug: 'xx59-headphones',
    name: 'XX59',
    price: 899,
    quantity: 2,
    image: '/assets/cart/image-xx59-headphones.jpg',
  },
  {
    slug: 'yx1-earphones',
    name: 'YX1',
    price: 599,
    quantity: 1,
    image: '/assets/cart/image-yx1-earphones.jpg',
  },
];

export type CartItemData = (typeof placeholderCartItems)[number];
