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
      <DialogBackdrop className="fixed inset-0 top-(--header-height) bg-black/50" />

      <div className="fixed inset-0 top-(--header-height) overflow-y-auto">
        <DialogPanel className="mx-auto max-w-6xl">{children}</DialogPanel>
      </div>
    </Dialog>
  );
};

export default Modal;
