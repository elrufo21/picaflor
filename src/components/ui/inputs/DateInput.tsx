import TextField, { type TextFieldProps } from "@mui/material/TextField";
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
};

function DateInput<T extends FieldValues>({
  name,
  control,
  defaultValue,
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
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true, ...(rest.InputLabelProps || {}) }}
          error={!!fieldState.error}
          helperText={fieldState.error?.message || rest.helperText}
        />
      )}
    />
  );
}

export default DateInput;
