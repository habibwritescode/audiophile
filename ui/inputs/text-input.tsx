import { cn } from '@/lib/helpers';

type Props = {
  label: string;
  errorMessage: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const TextInput = ({ label, name, type = 'text', errorMessage, ...props }: Props) => {
  const errorId = `${name}-error`;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={name} className={cn('text-12 text-black', { 'text-red': errorMessage })}>
          {label}
        </label>
        <p id={errorId} className="text-12 font-medium -tracking-[0.2px] text-red">
          {errorMessage}
        </p>
      </div>
      <input
        id={name}
        name={name}
        type={type}
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? errorId : undefined}
        className={cn(
          `h-14 rounded-lg border border-[#CFCFCF] pl-6 text-14 font-bold -tracking-[0.25px] caret-primary outline-none placeholder:text-black/40 focus:border-primary`,
          {
            'border-2 border-red focus:border-red': errorMessage,
          }
        )}
        {...props}
      />
    </div>
  );
};

export default TextInput;
