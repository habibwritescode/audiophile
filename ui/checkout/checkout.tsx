'use client';

import { useState } from 'react';
import { placeholderCartItems } from '@/lib/placeholder-cart';
import GoBack from '../go-back';
import CheckoutForm from './checkout-form';
import CheckoutSummary from './summary';
import ConfirmationModal from './confirmation-modal';

const SHIPPING_FEE_CENTS = 5000;
const VAT_RATE = 0.2;

const Checkout = () => {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const items = placeholderCartItems;
  const total = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const vat = Math.round(total * VAT_RATE);
  const grandTotal = total + SHIPPING_FEE_CENTS;

  return (
    <>
      <div className="bg-gray-200 px-6 pt-4 pb-25 md:px-10 md:pt-12 xl:pt-20 xl:pb-35">
        <div className="mx-auto max-w-6xl">
          <GoBack />
          <section className="mt-6 grid gap-8 xl:mt-9.5 xl:grid-cols-[65%_1fr] xl:gap-7.5">
            <CheckoutForm onSubmit={() => setIsConfirmationOpen(true)} />
            <CheckoutSummary
              items={items}
              total={total}
              shipping={SHIPPING_FEE_CENTS}
              vat={vat}
              grandTotal={grandTotal}
            />
          </section>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        items={items}
        grandTotal={grandTotal}
      />
    </>
  );
};

export default Checkout;
