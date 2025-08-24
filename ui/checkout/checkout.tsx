import React from 'react';
import GoBack from '../go-back';
import CheckoutForm from './checkout-form';
import CheckoutSummary from './summary';

const Checkout = () => {
  return (
    <div className="bg-gray-200 px-6 pt-4 pb-25 md:px-10 md:pt-12 xl:pt-20 xl:pb-35">
      <div className="mx-auto max-w-6xl">
        <GoBack />
        <section className="mt-6 grid gap-8 xl:mt-9.5 xl:grid-cols-[65%_1fr] xl:gap-7.5">
          <CheckoutForm />
          <CheckoutSummary />
        </section>
      </div>
    </div>
  );
};

export default Checkout;
