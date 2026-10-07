import Image from 'next/image';
import { formatAmount } from '@/lib/helpers';
import QuantitySelector from '../quantity-selector';

type Props = {
  name: string;
  priceCents: number;
  qty: number;
  image: string;
  // When provided, renders a quantity selector instead of the "xN" label
  onQtyChange?: (qty: number) => void;
};

const CartItem = ({ name, priceCents, qty, image, onQtyChange }: Props) => {
  return (
    <li className="flex items-center gap-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Image src={image} alt="" fill sizes="64px" className="object-cover" />
      </div>

      <div className="flex flex-grow items-center gap-2">
        <div>
          <p className="text-15 font-bold text-black">{name}</p>
          <p className="text-14 font-bold tracking-normal text-black/50">
            {formatAmount(priceCents)}
          </p>
        </div>
        {onQtyChange ? (
          <QuantitySelector
            value={qty}
            handleChange={onQtyChange}
            min={0}
            className="ml-auto h-8 w-24 justify-between gap-0 px-3"
          />
        ) : (
          <p className="ml-auto text-15 font-bold text-black/50">x{qty}</p>
        )}
      </div>
    </li>
  );
};

export default CartItem;
