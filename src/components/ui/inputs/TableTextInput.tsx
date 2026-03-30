import { forwardRef } from "react";
import { getFocusableElements } from "@/shared/helpers/formFocus";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  textAlign?: "left" | "center" | "right";
  disabled?: boolean;
  className?: string;
  navColumn?: string;
  navRow?: number;
  textSize?: "xs" | "sm" | "base" | "lg";
};

const TableTextInput = forwardRef<HTMLInputElement, Props>(
  function TableTextInput(
    {
      id,
      value,
      onChange,
      placeholder,
      type = "text",
      textAlign = "left",
      disabled = false,
      className,
      navColumn,
      navRow,
      textSize = "sm",
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

    const shouldUppercase = type === "text";
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

    const textAlignClass =
      textAlign === "right"
        ? "text-right"
        : textAlign === "center"
          ? "text-center"
          : "text-left";
    const textSizeClass =
      textSize === "xs"
        ? "text-xs"
        : textSize === "base"
          ? "text-base"
          : textSize === "lg"
            ? "text-lg"
            : "text-sm";
    const baseClassName =
      `w-full rounded border border-slate-300 px-2 py-1 ${textSizeClass} focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 h-10`;
    const resolvedClassName = className
      ? `${baseClassName} ${className} ${textAlignClass}`
      : `${baseClassName} ${textAlignClass}`;

    return (
      <input
        ref={ref}
        id={id}
        data-nav-col={navColumn}
        data-nav-row={navRow}
        type={type}
        value={value}
        onChange={(event) => {
          const nextValue = shouldUppercase
            ? event.target.value.toUpperCase()
            : event.target.value;
          event.target.value = nextValue;
          onChange(nextValue);
        }}
        onKeyDown={(event) => {
          const target = event.currentTarget;
          const cursorPos = target.selectionStart ?? 0;

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
            return;
          }

          if (event.key === "ArrowRight" && cursorPos === target.value.length) {
            event.preventDefault();
            focusSibling(target);
            return;
          }

          if (event.key === "ArrowLeft" && cursorPos === 0) {
            event.preventDefault();
            focusSibling(target, { reverse: true });
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="new-password"
        autoCorrect="off"
        spellCheck={false}
        autoCapitalize="none"
        aria-autocomplete="none"
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
        data-form-type="other"
        data-autocomplete="off"
        className={resolvedClassName}
      />
    );
  },
);

export default TableTextInput;
