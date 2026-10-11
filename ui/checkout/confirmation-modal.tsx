import { useId, useState } from 'react';
import Image from 'next/image';
import { cn, formatAmount } from '@/lib/helpers';
import { CartLine } from '@/lib/cart-store';
import Modal from '../modal';
import { ButtonLink } from '../button';
import CartItem from '../cart/cart-item';

import confirmOrderIcon from '@/public/assets/checkout/icon-order-confirmation.svg';

type Props = {
  isOpen: boolean;
  onBackToHome: () => void;
  items: CartLine[];
  grandTotal: number;
  /** Card orders: what Paystack actually charged, in naira */
  chargedNaira?: string;
  /** The stored order's number, e.g. AUD-000123 */
  orderNumber: string;
};

const ConfirmationModal = ({
  isOpen,
  onBackToHome,
  items,
  grandTotal,
  chargedNaira,
  orderNumber,
}: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const otherItemsId = useId();

  const [firstItem, ...otherItems] = items;
  const otherItemsCount = otherItems.length;
  const itemRow = (item: CartLine) => (
    <CartItem
      key={item.slug}
      name={item.shortName}
      priceCents={item.priceCents}
      qty={item.quantity}
      image={item.cartImage}
    />
  );

  return (
    // Not dismissible: once the order is placed, the only way out is "Back to home"
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      origin="center"
      containerClassName="flex justify-center px-6 py-6 md:pt-28 xl:pt-56"
      panelClassName="w-full max-w-135 rounded-lg bg-white p-8 md:p-12"
    >
      {/* Arrives just after the panel: the one moment in the store worth celebrating */}
      <Image
        src={confirmOrderIcon}
        alt=""
        className="[transition:scale_300ms_var(--ease-out)_120ms,opacity_200ms_var(--ease-out)_120ms] starting:scale-80 starting:opacity-0 motion-reduce:starting:scale-100"
      />
      <h3 className="mt-6 mb-4 text-24 text-black md:mt-8 md:mb-6 md:text-32">
        THANK YOU <br /> FOR YOUR ORDER
      </h3>
      <p className="mb-6 text-15 text-black/50 md:mb-8">
        Your order number is <span className="font-bold text-black">{orderNumber}</span>.
      </p>

      <div className="mb-6 grid overflow-hidden rounded-lg md:mb-12 md:grid-cols-[1fr_40%]">
        <div className="bg-gray-100 p-6">
          <ul className="grid gap-4">{firstItem && itemRow(firstItem)}</ul>

          {otherItemsCount > 0 && (
            // Rows 0fr → 1fr animates to the list's natural height; inert while collapsed
            <div
              id={otherItemsId}
              inert={!isExpanded}
              className={cn(
                'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
                isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <ul
                  className={cn(
                    'grid gap-4 pt-4 transition-opacity duration-150 ease-out',
                    isExpanded ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  {otherItems.map(itemRow)}
                </ul>
              </div>
            </div>
          )}

          {otherItemsCount > 0 && (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={otherItemsId}
              onClick={() => setIsExpanded((prev) => !prev)}
              className="mt-3 w-full border-t border-black/10 pt-3 text-12 font-bold text-black/50 transition-colors hover:text-primary active:text-primary"
            >
              {isExpanded
                ? 'View less'
                : `and ${otherItemsCount} other item${otherItemsCount > 1 ? 's' : ''}`}
            </button>
          )}
        </div>

        <div className="flex flex-col justify-end bg-black px-6 pt-4 pb-5 md:pb-10.5">
          <p className="mb-2 text-15 text-white/50 uppercase">Grand Total</p>
          <p className="text-18 tracking-normal text-white">{formatAmount(grandTotal)}</p>
          {chargedNaira && (
            <p className="mt-2 text-15 text-white/50">Paid {chargedNaira} by card</p>
          )}
        </div>
      </div>

      <ButtonLink href="/" onClick={onBackToHome} fullWidth>
        Back to home
      </ButtonLink>
    </Modal>
  );
};

export default ConfirmationModal;
