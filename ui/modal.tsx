import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { cn } from '@/lib/helpers';

/** Where the panel grows from: its trigger for anchored panels, the middle for true modals */
type Origin = 'top' | 'top-right' | 'center';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  origin?: Origin;
  children: React.ReactNode;
};

const Modal = ({ isOpen, onClose, origin = 'top', children }: Props) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 top-(--header-height) bg-black/50 transition-opacity duration-200 ease-out data-closed:opacity-0 data-leave:duration-150"
      />

      <div className="fixed inset-0 top-(--header-height) overflow-y-auto">
        <DialogPanel
          transition
          className={cn(
            'mx-auto max-w-6xl transition-[opacity,translate,scale] duration-200 ease-out data-closed:opacity-0 data-leave:duration-150',
            {
              'origin-top data-closed:-translate-y-2': origin === 'top',
              'origin-top-right data-closed:-translate-y-1 data-closed:scale-[0.97]':
                origin === 'top-right',
              'origin-center duration-250 data-closed:scale-[0.96]': origin === 'center',
            },
            // Reduced motion keeps the fade and drops the movement
            'motion-reduce:data-closed:translate-y-0 motion-reduce:data-closed:scale-100'
          )}
        >
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default Modal;
