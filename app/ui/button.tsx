import React from 'react';
import { cn } from '../lib/helpers';

type Props = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'dark';
};

const Button = ({ children, variant = 'primary' }: Props) => {
  return (
    <button
      className={cn('grid h-12 place-items-center px-8 text-13 uppercase', {
        'bg-primary text-white hover:bg-primary-light': variant === 'primary',
        'border border-black bg-transparent text-black hover:bg-black hover:text-white':
          variant === 'secondary',
        'bg-black text-white hover:bg-[#4C4C4C]': variant === 'dark',
      })}
    >
      {children}
    </button>
  );
};

export default Button;
