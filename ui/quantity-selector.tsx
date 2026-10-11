import { cn } from '@/lib/helpers';

// The glyph is one character wide: padding widens the tap target, and the negative margin keeps
// the design's spacing
const STEP_BUTTON =
  '-m-2.5 p-2.5 text-18 text-black/25 transition-[color,scale] duration-100 ease-out hover:text-primary enabled:active:scale-90 disabled:cursor-not-allowed disabled:hover:text-black/25';

type Props = {
  value: number;
  handleChange: (val: number) => void;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
};

const QuantitySelector = ({
  value,
  handleChange,
  className,
  min = 1,
  max = Infinity,
  disabled,
}: Props) => {
  const handleIncrement = () => handleChange(Math.min(max, value + 1));
  const handleDecrement = () => handleChange(Math.max(min, value - 1));

  return (
    <div className={cn('flex h-12 items-center gap-5.5 bg-gray-100 p-6', className)}>
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={handleDecrement}
        disabled={disabled}
        className={STEP_BUTTON}
      >
        -
      </button>
      <p className="text-13 text-black">{value}</p>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={STEP_BUTTON}
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;
