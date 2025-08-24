import { cn } from '@/lib/helpers';

type Props = {
  label: string;
  errorMessage: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const TextInput = ({
  label,
  value,
  placeholder,
  name,
  type = 'text',
  onChange,
  errorMessage,
}: Props) => {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={name} className={`text-12 text-black ${errorMessage ? 'text-red' : ''}`}>
          {label}
        </label>
        <p className="text-12 font-medium text-red">{errorMessage}</p>
      </div>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        className={cn(
          `h-14 rounded-lg border border-[#CFCFCF] pl-6 text-14 font-bold -tracking-[0.25] caret-primary outline-none placeholder:text-black/40 focus:border-primary`,
          {
            'border-2 border-red': errorMessage,
          }
        )}
        onChange={onChange}
      />
    </div>
  );
};

export default TextInput;
