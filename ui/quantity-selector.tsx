import { cn } from '@/lib/helpers';

type Props = {
  value: number;
  handleChange: (val: number) => void;
  className?: string;
  disabled?: boolean;
  min?: number;
};

const QuantitySelector = ({ value, handleChange, className, min = 1, disabled }: Props) => {
  const handleIncrement = () => handleChange(value + 1);
  const handleDecrement = () => handleChange(Math.max(min, value - 1));

  return (
    <div className={cn('flex h-12 items-center gap-5.5 bg-gray-100 p-6', className)}>
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={handleDecrement}
        disabled={disabled}
        className="text-18 text-black/25 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:hover:text-black/25"
      >
        -
      </button>
      <p className="text-13 text-black">{value}</p>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={handleIncrement}
        disabled={disabled}
        className="text-18 text-black/25 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:hover:text-black/25"
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;
