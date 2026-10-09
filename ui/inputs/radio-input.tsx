import { cn } from '@/lib/helpers';

type Props = {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const RadioInput = ({ label, name, value, checked, onChange, disabled }: Props) => {
  return (
    <label
      className={cn(
        'flex h-14 cursor-pointer items-center gap-4 rounded-lg border border-[#CFCFCF] px-4 transition-colors hover:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
        {
          'border-primary': checked,
          'cursor-not-allowed opacity-50 hover:border-[#CFCFCF]': disabled,
        }
      )}
    >
      <span className="grid size-5 place-items-center rounded-full border border-[#CFCFCF]">
        <input
          name={name}
          value={value}
          type="radio"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="size-2.5 cursor-pointer appearance-none rounded-full outline-none checked:bg-primary"
        />
      </span>
      <span className="text-14 font-bold -tracking-[0.25px] text-black">{label}</span>
    </label>
  );
};

export default RadioInput;
