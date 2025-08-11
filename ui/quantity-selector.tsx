import { cn } from '@/lib/helpers';

type Props = {
  value: number;
  handleChange: (val: number) => void;
  className?: string;
};

const QuantitySelector = ({ value, handleChange, className }: Props) => {
  const handleIncrement = () => handleChange(Math.max(0, value + 1));
  const handleDecrement = () => handleChange(Math.max(0, value - 1));

  return (
    <div className={cn(`flex h-12 items-center gap-5.5 bg-gray-100 p-6 ${className}`)}>
      <span
        onClick={handleDecrement}
        className="cursor-pointer text-18 text-black/25 hover:text-primary"
      >
        -
      </span>
      <p className="text-13 text-black">{value}</p>

      <span
        onClick={handleIncrement}
        className="cursor-pointer text-18 text-black/25 hover:text-primary"
      >
        +
      </span>
    </div>
  );
};

export default QuantitySelector;
