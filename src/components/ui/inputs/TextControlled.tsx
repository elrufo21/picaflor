import TextField, { type TextFieldProps } from "@mui/material/TextField";
import type { ChangeEvent } from "react";
import {
  Controller,
  type FieldValues,
  type Control,
  type Path,
} from "react-hook-form";

/* ===========================
   HELPER DE FOCO
=========================== */
function focusNextElement(
  current: HTMLElement | null,
  form?: HTMLElement | null,
  options?: { reverse?: boolean },
) {
  if (!current || !form) return;

  const focusable = Array.from(
    form.querySelectorAll<HTMLElement>(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"),
  );

  const index = focusable.indexOf(current);
  if (index === -1) return;

  const nextIndex = options?.reverse ? index - 1 : index + 1;
  focusable[nextIndex]?.focus();
}

type Props<T extends FieldValues> = Omit<
  TextFieldProps,
  "name" | "defaultValue"
> & {
  name: Path<T>;
  control: Control<T>;
  defaultValue?: T[Path<T>];
  transform?: (value: string) => string;
  formatter?: (value: string | number) => string;
  displayZeroAsEmpty?: boolean;

  disableHistory?: boolean;
};

function TextControlled<T extends FieldValues>({
  name,
  control,
  defaultValue,
  transform,
  formatter,
  displayZeroAsEmpty,
  disableHistory,
  ...rest
}: Props<T>) {
  const {
    onChange: restOnChange,
    inputProps: restInputProps,
    ...restProps
  } = rest;
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => {
        const { ref, onChange, value, ...fieldProps } = field;

        const rawDisplayValue =
          displayZeroAsEmpty && (value === 0 || value === "0")
            ? ""
            : (value ?? "");
        const displayValue =
          formatter && rawDisplayValue !== "" && rawDisplayValue !== null
            ? formatter(rawDisplayValue)
            : rawDisplayValue;

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          const target = e.currentTarget;
          const form = target.closest("form");
          if (!form) return;

          if (e.key === "Enter") {
            e.preventDefault();
            focusNextElement(target, form);
          }

          if (e.key === "ArrowRight") {
            const pos = target.selectionStart ?? 0;
            if (pos === target.value.length) {
              e.preventDefault();
              focusNextElement(target, form);
            }
          }

          if (e.key === "ArrowLeft") {
            const pos = target.selectionStart ?? 0;
            if (pos === 0) {
              e.preventDefault();
              focusNextElement(target, form, { reverse: true });
            }
          }

          rest.inputProps?.onKeyDown?.(e as any);
        };

        return (
          <TextField
            {...restProps}
            {...fieldProps}
            value={displayValue}
            inputRef={ref}
            autoComplete={disableHistory ? "off" : restProps.autoComplete}
            onChange={(event) => {
              if (transform) {
                const nextValue = transform(event.target.value);
                onChange(nextValue);
                restOnChange?.(event);
                return;
              }
              onChange(event);
              restOnChange?.(event);
            }}
            inputProps={{
              ...restInputProps,
              onKeyDown: handleKeyDown,

              ...(disableHistory && {
                autoComplete: "off",
                autoCorrect: "off",
                spellCheck: false,
                "aria-autocomplete": "none",
              }),
            }}
            fullWidth
            error={!!fieldState.error}
            helperText={rest.helperText ?? fieldState.error?.message}
          />
        );
      }}
    />
  );
}

export default TextControlled;
