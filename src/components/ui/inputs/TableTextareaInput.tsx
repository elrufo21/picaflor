import { useLayoutEffect, useRef, type CSSProperties } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  rows?: number;
  maxLength?: number;
};

const TableTextareaInput = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  style,
  rows = 1,
  maxLength,
}: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(event) => onChange(event.target.value.toUpperCase())}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      maxLength={maxLength}
      style={style}
      className={`block min-h-10 w-full resize-none overflow-hidden rounded border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 ${className ?? ""}`}
    />
  );
};

export default TableTextareaInput;
