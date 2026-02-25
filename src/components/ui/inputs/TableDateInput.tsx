import { forwardRef } from "react";
import { getFocusableElements } from "@/shared/helpers/formFocus";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  navColumn?: string;
  navRow?: number;
  min?: string;
  max?: string;
};

const TableDateInput = forwardRef<HTMLInputElement, Props>(
  function TableDateInput(
    {
      id,
      value,
      onChange,
      disabled = false,
      className,
      navColumn,
      navRow,
      min,
      max,
    },
    ref,
  ) {
    const focusSibling = (
      target: HTMLInputElement,
      options?: { reverse?: boolean },
    ) => {
      const scope = target.closest("form") ?? target.ownerDocument;
      const focusables = getFocusableElements(scope);
      if (!focusables.length) return;

      const index = focusables.indexOf(target);
      if (index === -1) return;

      const nextIndex = options?.reverse ? index - 1 : index + 1;
      focusables[nextIndex]?.focus();
    };

    const focusVertical = (
      target: HTMLInputElement,
      direction: "up" | "down",
    ) => {
      if (!navColumn || navRow === undefined) return false;
      const nextRow = direction === "down" ? navRow + 1 : navRow - 1;
      if (nextRow < 0) return false;

      const scope =
        target.closest("table") ?? target.closest("form") ?? document;
      const selector = `input[data-nav-col="${navColumn}"][data-nav-row="${String(nextRow)}"]`;
      const next = scope.querySelector(selector) as HTMLInputElement | null;
      if (!next || next.disabled) return false;

      next.focus();
      return true;
    };

    return (
      <input
        ref={ref}
        id={id}
        data-nav-col={navColumn}
        data-nav-row={navRow}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onKeyDown={(event) => {
          const target = event.currentTarget;

          if (event.key === "Enter") {
            event.preventDefault();
            focusSibling(target);
            return;
          }

          if (event.key === "ArrowDown") {
            const moved = focusVertical(target, "down");
            if (moved) {
              event.preventDefault();
            } else {
              event.preventDefault();
              focusSibling(target);
            }
            return;
          }

          if (event.key === "ArrowUp") {
            const moved = focusVertical(target, "up");
            if (moved) {
              event.preventDefault();
            } else {
              event.preventDefault();
              focusSibling(target, { reverse: true });
            }
          }
        }}
        disabled={disabled}
        autoComplete="off"
        className={
          className ??
          "w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 h-10"
        }
      />
    );
  },
);

export default TableDateInput;
