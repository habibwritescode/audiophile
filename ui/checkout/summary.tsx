import { formatAmount } from '@/lib/helpers';
import { CartLine } from '@/lib/cart-store';
import CartItem from '../cart/cart-item';
import Button from '../button';
import { CHECKOUT_FORM_ID } from './checkout-form';

const busyLabels = {
  checking: 'Checking your cart…',
  paying: 'Waiting for payment…',
  confirming: 'Confirming payment…',
};

type Props = {
  items: CartLine[];
  total: number;
  shipping: number;
  vat: number;
  grandTotal: number;
  busy: 'checking' | 'paying' | 'confirming' | null;
  /** A card payment we couldn't confirm yet: the button re-checks it instead of paying again */
  awaitingConfirmation?: boolean;
  /** For card payments: the naira amount Paystack will charge */
  chargeNotice?: string;
};

const CheckoutSummary = ({
  items,
  total,
  shipping,
  vat,
  grandTotal,
  busy,
  chargeNotice,
  awaitingConfirmation,
}: Props) => {
  const summaryAmounts = [
    { title: 'Total', value: total },
    { title: 'Shipping', value: shipping },
    { title: 'VAT (Included)', value: vat },
  ];

  return (
    <div className="rounded-lg bg-white px-6 py-8 md:px-8.5">
      <h2 className="mb-8 text-18 text-black uppercase">summary</h2>

      <ul className="grid gap-6">
        {items.map((item) => (
          <CartItem
            key={item.slug}
            name={item.shortName}
            priceCents={item.priceCents}
            qty={item.quantity}
            image={item.cartImage}
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

      {chargeNotice && <p className="mb-4 text-15 text-black/50">{chargeNotice}</p>}

      <Button fullWidth type="submit" form={CHECKOUT_FORM_ID} disabled={busy !== null}>
        {busy ? busyLabels[busy] : awaitingConfirmation ? 'Check payment again' : 'Continue & Pay'}
      </Button>
    </div>
  );
};

export default CheckoutSummary;
