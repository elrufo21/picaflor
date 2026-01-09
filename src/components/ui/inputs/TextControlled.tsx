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
};

function TextControlled<T extends FieldValues>({
  name,
  control,
  defaultValue,
  transform,
  ...rest
}: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <TextField
          {...rest}
          {...field}
          onChange={(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            if (transform) {
              const nextValue = transform(event.target.value);
              field.onChange(nextValue);
              rest.onChange?.({
                ...event,
                target: { ...event.target, value: nextValue },
              } as ChangeEvent<HTMLInputElement | HTMLTextAreaElement>);
              return;
            }
            field.onChange(event);
            rest.onChange?.(event);
          }}
          fullWidth
          error={!!fieldState.error}
          helperText={fieldState.error?.message || rest.helperText}
        />
      )}
    />
  );
}

export default TextControlled;
