import TextField, { type TextFieldProps } from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import {
  Controller,
  type FieldValues,
  type Control,
  type Path,
} from "react-hook-form";

type Option = { label: string; value: string | number };

type Props<T extends FieldValues> = Omit<
  TextFieldProps,
  "name" | "select" | "defaultValue"
> & {
  name: Path<T>;
  control: Control<T>;
  options: Option[];
  defaultValue?: T[Path<T>];
};

function SelectControlled<T extends FieldValues>({
  name,
  control,
  options,
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
          select
          fullWidth
          onChange={(e) => {
            field.onChange(e);

            // 🔥 mover focus al siguiente input
            const nextSelector = (rest as any)["data-focus-next"];
            if (nextSelector) {
              setTimeout(() => {
                const next =
                  document.querySelector<HTMLInputElement>(nextSelector);
                next?.focus();
              }, 0);
            }
          }}
          error={!!fieldState.error}
          helperText={fieldState.error?.message || rest.helperText}
        >
          {options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

export default SelectControlled;
