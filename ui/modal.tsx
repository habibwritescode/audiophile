import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { cn } from '@/lib/helpers';

/** Where the panel grows from: its trigger for anchored panels, the middle for true modals */
type Origin = 'top' | 'top-right' | 'center';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  origin?: Origin;
  /** Positions the panel on the page (alignment, spacing around it) */
  containerClassName?: string;
  /** The panel itself: the visible card. Clicks anywhere outside it close the modal */
  panelClassName?: string;
  children: React.ReactNode;
};

const Modal = ({
  isOpen,
  onClose,
  origin = 'top',
  containerClassName,
  panelClassName,
  children,
}: Props) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 top-(--header-height) bg-black/50 transition-opacity duration-200 ease-out data-closed:opacity-0 data-leave:duration-150"
      />

      <div className="fixed inset-0 top-(--header-height) overflow-y-auto overscroll-contain">
        {/* The panel must be only the card: Headless UI treats every click inside it as "inside",
            so a full-width panel would swallow clicks on the dimmed space beside the card */}
        <div className={cn('mx-auto max-w-6xl', containerClassName)}>
          <DialogPanel
            transition
            className={cn(
              'transition-[opacity,translate,scale] duration-200 ease-out data-closed:opacity-0 data-leave:duration-150',
              {
                'origin-top data-closed:-translate-y-2': origin === 'top',
                'origin-top-right data-closed:-translate-y-1 data-closed:scale-[0.97]':
                  origin === 'top-right',
                'origin-center duration-250 data-closed:scale-[0.96]': origin === 'center',
              },
              // Reduced motion keeps the fade and drops the movement
              'motion-reduce:data-closed:translate-y-0 motion-reduce:data-closed:scale-100',
              panelClassName
            )}
          >
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default Modal;
