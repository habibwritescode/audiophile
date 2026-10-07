import { formatAmount } from '@/lib/helpers';
import { CartItemData } from '@/lib/placeholder-cart';
import CartItem from '../cart/cart-item';
import Button from '../button';
import { CHECKOUT_FORM_ID } from './checkout-form';

type Props = {
  items: CartItemData[];
  total: number;
  shipping: number;
  vat: number;
  grandTotal: number;
};

const CheckoutSummary = ({ items, total, shipping, vat, grandTotal }: Props) => {
  const summaryAmounts = [
    { title: 'Total', value: total },
    { title: 'Shipping', value: shipping },
    { title: 'VAT (Included)', value: vat },
  ];

  return (
    <div className="self-start rounded-lg bg-white px-6 py-8 md:px-8.5">
      <h2 className="mb-8 text-18 text-black uppercase">summary</h2>

      <ul className="grid gap-6">
        {items.map((item) => (
          <CartItem
            key={item.slug}
            name={item.name}
            priceCents={item.priceCents}
            qty={item.quantity}
            image={item.image}
          />
        ))}
      </ul>

      <div className="mt-8 mb-6 grid gap-2">
        {summaryAmounts.map((item) => (
          <div key={item.title} className="flex justify-between">
            <p className="text-15 text-black/50 uppercase">{item.title}</p>
            <p className="text-18 tracking-normal text-black">{formatAmount(item.value)}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 flex justify-between">
        <p className="text-15 text-black/50 uppercase">Grand Total</p>
        <p className="text-18 tracking-normal text-primary">{formatAmount(grandTotal)}</p>
      </div>

      <Button fullWidth type="submit" form={CHECKOUT_FORM_ID}>
        Continue & Pay
      </Button>
    </div>
  );
};

export default CheckoutSummary;
