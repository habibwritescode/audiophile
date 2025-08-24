type Props = {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const RadioInput = ({ label, name, onChange, checked }: Props) => {
  return (
    <div
      className={`flex h-14 items-center gap-4 rounded-lg border border-[#CFCFCF] px-4 ${checked ? 'border-primary' : ''}`}
    >
      <div className="grid size-5 place-items-center rounded-full border border-[#CFCFCF]">
        <input
          id={name}
          name={name}
          type="radio"
          onChange={onChange}
          className="size-2.5 appearance-none rounded-full checked:bg-primary"
        />
      </div>
      <label htmlFor={name} className="text-14 font-bold -tracking-[0.25px] text-black">
        {label}
      </label>
    </div>
  );
};

export default RadioInput;
