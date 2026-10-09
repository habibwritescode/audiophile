import type { Metadata } from 'next';
import { isCardPaymentConfigured } from '@/lib/paystack';
import Checkout from '@/ui/checkout/checkout';

export const metadata: Metadata = {
  title: 'Checkout',
};

const Page = () => {
  return (
    <div>
      <Checkout cardAvailable={isCardPaymentConfigured()} />
    </div>
  );
};

export default Page;
