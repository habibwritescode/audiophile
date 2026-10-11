import Image from 'next/image';
import { formatAmount } from '@/lib/helpers';
import QuantitySelector from '../quantity-selector';

type Props = {
  name: string;
  priceCents: number;
  qty: number;
  /** In stock, when known: "+" stops there */
  maxQty?: number;
  image: string;
  // When provided, renders a quantity selector instead of the "xN" label
  onQtyChange?: (qty: number) => void;
};

const CartItem = ({ name, priceCents, qty, maxQty, image, onQtyChange }: Props) => {
  return (
    <li className="flex items-center gap-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Image src={image} alt="" fill sizes="64px" className="object-cover" />
      </div>

      <div className="flex min-w-0 flex-grow items-center gap-2">
        {/* Until the cart check corrects it, a stored line can carry a long old name. contain:
            inline-size stops that one-line name from setting the row's minimum width (which would
            widen the cart card, the summary and the confirmation past the screen); it fills the
            space left and the name is cut with an ellipsis instead */}
        <div className="min-w-0 flex-1 [contain:inline-size]">
          <p className="truncate text-15 font-bold text-black">{name}</p>
          <p className="text-14 font-bold tracking-normal text-black/50">
            {formatAmount(priceCents)}
          </p>
        </div>
        {onQtyChange ? (
          <QuantitySelector
            value={qty}
            handleChange={onQtyChange}
            min={0}
            max={maxQty}
            className="ml-auto h-8 w-24 shrink-0 justify-between gap-0 px-3 max-xs:w-20"
          />
        ) : (
          <p className="ml-auto shrink-0 text-15 font-bold text-black/50">x{qty}</p>
        )}
      </div>
    </li>
  );
};

export default CartItem;
