import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { useState } from "react";
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
  disableAutoUppercase?: boolean;

  disableHistory?: boolean;
};

function TextControlled<T extends FieldValues>({
  name,
  control,
  defaultValue,
  transform,
  formatter,
  displayZeroAsEmpty,
  disableAutoUppercase,
  disableHistory,
  ...rest
}: Props<T>) {
  const {
    onChange: restOnChange,
    onFocus: restOnFocus,
    inputProps: restInputProps,
    ...restProps
  } = rest;
  const [historyUnlocked, setHistoryUnlocked] = useState(false);
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => {
        const { ref, onChange, value, ...fieldProps } = field;
        const shouldDisableHistory = disableHistory ?? true;
        const fieldKey = String(name ?? "field")
          .replace(/[^a-zA-Z0-9_-]/g, "-")
          .toLowerCase();
        const inputType =
          typeof restProps.type === "string"
            ? restProps.type.toLowerCase()
            : "text";
        const historyAutoCompleteValue = shouldDisableHistory
          ? `no-history-${fieldKey}`
          : restProps.autoComplete;
        const inputAutoCompleteValue = shouldDisableHistory
          ? "new-password"
          : inputType === "password"
            ? "new-password"
            : restInputProps?.autoComplete ?? "on";
        const lockPasswordHistory =
          shouldDisableHistory && inputType === "password" && !historyUnlocked;
        const shouldUppercase = inputType === "text" && !disableAutoUppercase;

        const shouldHideZero =
          (displayZeroAsEmpty || inputType === "number") &&
          (value === 0 || value === "0");
        const rawDisplayValue = shouldHideZero ? "" : (value ?? "");
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

          rest.inputProps?.onKeyDown?.(e);
        };

        return (
          <TextField
            {...restProps}
            {...fieldProps}
            value={displayValue}
            inputRef={ref}
            autoComplete={historyAutoCompleteValue}
            onFocus={(event) => {
              if (
                shouldDisableHistory &&
                inputType === "password" &&
                !historyUnlocked
              ) {
                setHistoryUnlocked(true);
              }
              restOnFocus?.(event);
            }}
            onChange={(event) => {
              const currentValue = event.target.value;
              const normalizedValue =
                shouldUppercase && typeof currentValue === "string"
                  ? currentValue.toUpperCase()
                  : currentValue;

              if (transform) {
                const nextValue = transform(normalizedValue);
                event.target.value = nextValue;
                onChange(nextValue);
                restOnChange?.(event);
                return;
              }

              event.target.value = normalizedValue;
              onChange(event);
              restOnChange?.(event);
            }}
            inputProps={{
              ...restInputProps,
              onKeyDown: handleKeyDown,
              readOnly: lockPasswordHistory || restInputProps?.readOnly,

              ...(shouldDisableHistory && {
                autoComplete: inputAutoCompleteValue,
                autoCorrect: "off",
                spellCheck: false,
                autoCapitalize: "none",
                "aria-autocomplete": "none",
                "data-lpignore": "true",
                "data-1p-ignore": "true",
                "data-bwignore": "true",
                "data-form-type": "other",
                "data-autocomplete": "off",
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
