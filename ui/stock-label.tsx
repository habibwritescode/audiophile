import { cn } from '@/lib/helpers';
import { stockLabel } from '@/lib/stock';

type Props = {
  stock: number;
  className?: string;
};

const StockLabel = ({ stock, className }: Props) => {
  const label = stockLabel(stock);
  if (!label) return null;

  return (
    <p className={cn('text-13 uppercase', stock === 0 ? 'text-red' : 'text-primary', className)}>
      {label}
    </p>
  );
};

export default StockLabel;
