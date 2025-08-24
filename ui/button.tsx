import { cn } from '@/lib/helpers';

type Props = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'dark';
  fullWidth?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({ children, variant = 'primary', fullWidth, ...props }: Props) => {
  return (
    <button
      className={cn('grid h-12 place-items-center px-8 text-13 uppercase', {
        'bg-primary text-white hover:bg-primary-light': variant === 'primary',
        'border border-black bg-transparent text-black hover:bg-black hover:text-white':
          variant === 'secondary',
        'bg-black text-white hover:bg-[#4C4C4C]': variant === 'dark',
        'cursor-not-allowed opacity-50': props.disabled,
        'cursor-pointer': !props.disabled,
        'w-full': fullWidth,
      })}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
