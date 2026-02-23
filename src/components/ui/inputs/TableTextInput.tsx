import { forwardRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  disabled?: boolean;
  className?: string;
};

const TableTextInput = forwardRef<HTMLInputElement, Props>(
  function TableTextInput(
    {
      value,
      onChange,
      placeholder,
      type = "text",
      disabled = false,
      className,
    },
    ref,
  ) {
    return (
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={
          className ??
          "w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
        }
      />
    );
  },
);

export default TableTextInput;
