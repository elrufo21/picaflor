import { type CSSProperties } from "react";
import { focusNextElement } from "@/shared/helpers/formFocus";

type Option = { id: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
};

export default function TableSelectInput({
  value,
  onChange,
  options,
  placeholder = "Seleccione",
  disabled = false,
  className,
  style,
}: Props) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => {
        onChange(event.target.value);
        const target = event.currentTarget;
        setTimeout(() => focusNextElement(target, target.closest("form")), 0);
      }}
      className={`h-10 w-full rounded border border-slate-300 bg-white px-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 ${className ?? ""}`}
      style={style}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select>
  );
}
