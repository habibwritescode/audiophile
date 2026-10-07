import type { Metadata } from 'next';
import Checkout from '@/ui/checkout/checkout';

export const metadata: Metadata = {
  title: 'Checkout',
};

const Page = () => {
  return (
    <div>
      <Checkout />
    </div>
  );
};

export default Page;
