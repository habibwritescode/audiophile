import { useState } from 'react';
import Image from 'next/image';
import { formatAmount } from '@/lib/helpers';
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
};

const ConfirmationModal = ({ isOpen, onBackToHome, items, grandTotal }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleItems = isExpanded ? items : items.slice(0, 1);
  const otherItemsCount = items.length - 1;

  return (
    // Not dismissible: once the order is placed, the only way out is "Back to home"
    <Modal isOpen={isOpen} onClose={() => {}}>
      <div className="flex justify-center px-6 py-6 md:pt-28 xl:pt-56">
        <div className="w-full max-w-135 rounded-lg bg-white p-8 md:p-12">
          <Image src={confirmOrderIcon} alt="" />
          <h3 className="mt-6 mb-4 text-24 text-black md:mt-8 md:mb-6 md:text-32">
            THANK YOU <br /> FOR YOUR ORDER
          </h3>
          <p className="mb-6 text-15 text-black/50 md:mb-8">
            You will receive an email confirmation shortly.
          </p>

          <div className="mb-6 grid overflow-hidden rounded-lg md:mb-12 md:grid-cols-[1fr_40%]">
            <div className="bg-gray-100 p-6">
              <ul className="grid gap-4">
                {visibleItems.map((item) => (
                  <CartItem
                    key={item.slug}
                    name={item.shortName}
                    priceCents={item.priceCents}
                    qty={item.quantity}
                    image={item.cartImage}
                  />
                ))}
              </ul>

              {otherItemsCount > 0 && (
                <button
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="mt-3 w-full border-t border-black/10 pt-3 text-12 font-bold text-black/50 transition-colors hover:text-primary"
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
            </div>
          </div>

          <ButtonLink href="/" onClick={onBackToHome} fullWidth>
            Back to home
          </ButtonLink>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
