import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { useId, useState } from "react";
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
  const rawInputId = useId();
  const safeInputId = rawInputId.replace(/[^a-zA-Z0-9_-]/g, "");
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
          ? "new-password"
          : restProps.autoComplete;
        const inputAutoCompleteValue = shouldDisableHistory
          ? "new-password"
          : inputType === "password"
            ? "new-password"
            : restInputProps?.autoComplete ?? "on";
        const lockHistoryInput = shouldDisableHistory && !historyUnlocked;
        const historySafeFieldName = `nh-${fieldKey}-${safeInputId}`;
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
          const nextSelector = (
            restInputProps as { "data-focus-next"?: string } | undefined
          )?.["data-focus-next"];
          const form = target.closest("form");

          if (inputType === "number" && e.key === "ArrowUp") {
            e.preventDefault();
            if (form) {
              focusNextElement(target, form, { reverse: true });
            }
            rest.inputProps?.onKeyDown?.(e);
            return;
          }

          if (inputType === "number" && e.key === "ArrowDown") {
            e.preventDefault();
            if (form) {
              focusNextElement(target, form);
            }
            rest.inputProps?.onKeyDown?.(e);
            return;
          }

          if (e.key === "Enter" && nextSelector) {
            e.preventDefault();
            document.querySelector<HTMLElement>(nextSelector)?.focus();
            rest.inputProps?.onKeyDown?.(e);
            return;
          }
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
            name={shouldDisableHistory ? historySafeFieldName : fieldProps.name}
            id={
              shouldDisableHistory
                ? `${historySafeFieldName}-input`
                : restProps.id
            }
            value={displayValue}
            inputRef={ref}
            autoComplete={historyAutoCompleteValue}
            onFocus={(event) => {
              if (shouldDisableHistory && !historyUnlocked) {
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
              readOnly: lockHistoryInput || restInputProps?.readOnly,

              ...(shouldDisableHistory && {
                name: historySafeFieldName,
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
