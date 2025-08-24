import React from 'react';
import CartItem from '../cart/cart-item';
import Button from '../button';

const CheckoutSummary = () => {
  const summaryAmounts = [
    { title: 'Total', value: '5396' },
    { title: 'Shipping', value: '50' },
    { title: 'VAT (Included)', value: '5396' },
  ];
  return (
    <div className="rounded-lg bg-white px-6 py-8 md:px-8.5">
      <h1 className="mb-8 text-18 text-black uppercase">summary</h1>

      <ul className="grid gap-6">
        <CartItem name="xx99" price={2999} qty={2} />
        <CartItem name="xx99" price={2999} qty={2} />
      </ul>

      <div className="mt-8 mb-6 grid gap-2">
        {summaryAmounts.map((item) => (
          <div key={item.title} className="flex justify-between">
            <p className="text-15 text-black/50 uppercase">{item.title}</p>
            <p className="text-18 tracking-normal text-black">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 flex justify-between">
        <p className="text-15 text-black/50 uppercase">Grand Total</p>
        <p className="text-18 tracking-normal text-primary">1234</p>
      </div>

      <Button fullWidth>Continue & Pay</Button>
    </div>
  );
};

export default CheckoutSummary;
