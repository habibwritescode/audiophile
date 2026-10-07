import Link from 'next/link';
import { cn } from '@/lib/helpers';

type Variant = 'primary' | 'secondary' | 'dark';

type StyleProps = {
  variant?: Variant;
  fullWidth?: boolean;
  disabled?: boolean;
};

const buttonClasses = ({ variant = 'primary', fullWidth, disabled }: StyleProps) =>
  cn('grid h-12 place-items-center px-8 text-13 uppercase transition-colors', {
    'bg-primary text-white hover:bg-primary-light': variant === 'primary',
    'border border-black bg-transparent text-black hover:bg-black hover:text-white':
      variant === 'secondary',
    'bg-black text-white hover:bg-[#4C4C4C]': variant === 'dark',
    'cursor-not-allowed opacity-50': disabled,
    'cursor-pointer': !disabled,
    'w-full': fullWidth,
    'w-fit': !fullWidth,
  });

type ButtonProps = {
  children: React.ReactNode;
} & Omit<StyleProps, 'disabled'> &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({ children, variant, fullWidth, ...props }: ButtonProps) => {
  return (
    <button className={buttonClasses({ variant, fullWidth, disabled: props.disabled })} {...props}>
      {children}
    </button>
  );
};

type ButtonLinkProps = {
  children: React.ReactNode;
  href: string;
  onClick?: () => void;
} & Omit<StyleProps, 'disabled'>;

// Looks like a Button but navigates. Use instead of wrapping <Button> in <Link>.
export const ButtonLink = ({ children, href, onClick, variant, fullWidth }: ButtonLinkProps) => {
  return (
    <Link href={href} onClick={onClick} className={buttonClasses({ variant, fullWidth })}>
      {children}
    </Link>
  );
};

export default Button;
