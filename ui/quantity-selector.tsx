import { cn } from '@/lib/helpers';

// The glyph is one character wide: padding widens the tap target, and the negative margin keeps
// the design's spacing
const STEP_BUTTON =
  '-m-2.5 p-2.5 text-18 text-black/60 transition-[color,scale] duration-100 ease-out hover:text-primary enabled:active:scale-90 disabled:cursor-not-allowed disabled:text-black/25 disabled:hover:text-black/25';

type Props = {
  value: number;
  handleChange: (val: number) => void;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  /** At quantity 1, "−" becomes a remove button (the cart), instead of stopping at min */
  onRemove?: () => void;
  /** Accessible name of the remove button, e.g. "Remove XX59" */
  removeLabel?: string;
};

const QuantitySelector = ({
  value,
  handleChange,
  className,
  min = 1,
  max = Infinity,
  disabled,
  onRemove,
  removeLabel = 'Remove',
}: Props) => {
  const handleIncrement = () => handleChange(Math.min(max, value + 1));
  const handleDecrement = () => handleChange(Math.max(min, value - 1));

  return (
    <div className={cn('flex h-12 items-center gap-5.5 bg-gray-100 p-6', className)}>
      {onRemove && value <= 1 ? (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          disabled={disabled}
          className={STEP_BUTTON}
        >
          <svg width="12" height="13" viewBox="0 0 12 13" aria-hidden="true" className="block">
            <path
              fill="currentColor"
              d="M4 0h4v1h4v1.5H0V1h4V0ZM1 3.5h10l-.8 8.6A1 1 0 0 1 9.2 13H2.8a1 1 0 0 1-1-.9L1 3.5Zm3 1.5v6h1.2V5H4Zm2.8 0v6H8V5H6.8Z"
            />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={handleDecrement}
          disabled={disabled}
          className={STEP_BUTTON}
        >
          -
        </button>
      )}
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
