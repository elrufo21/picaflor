import TextField, { type TextFieldProps } from "@mui/material/TextField";
import type { ChangeEvent } from "react";
import {
  Controller,
  type FieldValues,
  type Control,
  type Path,
} from "react-hook-form";

type Props<T extends FieldValues> = Omit<
  TextFieldProps,
  "name" | "defaultValue"
> & {
  name: Path<T>;
  control: Control<T>;
  defaultValue?: T[Path<T>];
  transform?: (value: string) => string;
  displayZeroAsEmpty?: boolean;
};

function TextControlled<T extends FieldValues>({
  name,
  control,
  defaultValue,
  transform,
  displayZeroAsEmpty,
  ...rest
}: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => {
        const { ref, onChange, value, ...fieldProps } = field;
        const displayValue =
          displayZeroAsEmpty && (value === 0 || value === "0")
            ? ""
            : value ?? "";
        return (
          <TextField
            {...rest}
            {...fieldProps}
            value={displayValue}
            inputRef={ref} // 🔥 CLAVE ABSOLUTA
            onChange={(
              event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => {
              if (transform) {
                const nextValue = transform(event.target.value);
                onChange(nextValue);
                rest.onChange?.({
                  ...event,
                  target: { ...event.target, value: nextValue },
                } as ChangeEvent<HTMLInputElement | HTMLTextAreaElement>);
                return;
              }
              onChange(event);
              rest.onChange?.(event);
            }}
            fullWidth
            error={!!fieldState.error}
            helperText={rest.helperText}
          />
        );
      }}
    />
  );
}

export default TextControlled;
