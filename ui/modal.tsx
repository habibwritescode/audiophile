import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const Modal = ({ isOpen, onClose, children }: Props) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      transition
      className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
    >
      <DialogBackdrop className="fixed inset-0 top-22.5 bg-black/50 xl:top-24.5" />

      <div className="fixed inset-0 top-22.5 overflow-y-auto xl:top-24.5">
        <DialogPanel className="mx-auto max-w-6xl">{children}</DialogPanel>
      </div>
    </Dialog>
  );
};

export default Modal;
