'use client';

import { useEffect, useState } from 'react';
import { useCartHydrated } from '@/lib/cart-store';
import { orderTotals, formatNaira, toChargeKobo } from '@/lib/pricing';
import ConfirmationModal from '@/ui/checkout/confirmation-modal';
import { Dataset, carts, confirmations } from './worst-case-fixtures';

const DATASETS: { id: Dataset; label: string }[] = [
  { id: 'demo', label: 'Demo data' },
  { id: 'worst', label: 'Worst case' },
  { id: 'empty', label: 'Empty' },
  { id: 'one', label: 'One' },
];

const readParams = () => {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');
  return {
    dataset: DATASETS.some((d) => d.id === data) ? (data as Dataset) : null,
    confirmation: params.get('confirmation') === '1',
  };
};

const writeParams = (dataset: Dataset, confirmation: boolean) => {
  const url = new URL(window.location.href);
  url.searchParams.set('data', dataset);
  if (confirmation) url.searchParams.set('confirmation', '1');
  else url.searchParams.delete('confirmation');
  window.history.replaceState(null, '', url);
};

// Written to storage when this module loads, before CartHydration reads it: the page then loads
// the fixture exactly as it would a stored cart, and checkout's on-arrival check runs on it
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const { dataset } = readParams();
  if (dataset) {
    window.localStorage.setItem(
      'audiophile-cart',
      JSON.stringify({ state: { lines: carts[dataset] }, version: 1 })
    );
  }
}

const formatOrderNumber = (number: number) => `AUD-${String(number).padStart(6, '0')}`;

/**
 * Dev only (rendered by app/layout.tsx when NODE_ENV is development): swaps the cart for a fixture
 * through the cart store, and can open the order confirmation with fixture props. The choice lives
 * in the URL (?data=worst&confirmation=1), so a reload or another page keeps it.
 */
const DevDataToggle = () => {
  const hydrated = useCartHydrated();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const params = readParams();
    setDataset(params.dataset);
    setConfirmation(params.confirmation);
  }, [hydrated]);

  // Reloads, so the new cart goes through the same path as a stored one (see above)
  const choose = (next: Dataset) => {
    writeParams(next, confirmation);
    window.location.reload();
  };

  const toggleConfirmation = () => {
    const next = !confirmation;
    setConfirmation(next);
    writeParams(dataset ?? 'demo', next);
  };

  const order = confirmation && dataset ? confirmations[dataset] : null;
  const grandTotal = order ? orderTotals(order.lines).grandTotal : 0;

  return (
    <>
      {order && (
        <ConfirmationModal
          isOpen
          onBackToHome={toggleConfirmation}
          items={order.lines}
          grandTotal={grandTotal}
          chargedNaira={formatNaira(toChargeKobo(grandTotal))}
          orderNumber={formatOrderNumber(order.orderNumber)}
        />
      )}
      <div
        role="group"
        aria-label="Dev data"
        className="fixed bottom-3 left-1/2 z-[60] flex max-w-[calc(100vw-1rem)] -translate-x-1/2 flex-wrap justify-center gap-0.5 rounded-2xl bg-black/10 p-1 font-sans text-[12px] text-black shadow-sm backdrop-blur"
      >
        {DATASETS.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={dataset === d.id}
            onClick={() => choose(d.id)}
            className={`rounded-full px-2 py-1 whitespace-nowrap ${dataset === d.id ? 'bg-white shadow-sm' : ''}`}
          >
            {d.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={confirmation}
          onClick={toggleConfirmation}
          className={`rounded-full px-2 py-1 whitespace-nowrap ${confirmation ? 'bg-white shadow-sm' : ''}`}
        >
          Confirmation
        </button>
      </div>
    </>
  );
};

export default DevDataToggle;
