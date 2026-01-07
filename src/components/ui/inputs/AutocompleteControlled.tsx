import Autocomplete, {
  type AutocompleteProps,
  type AutocompleteRenderInputParams,
} from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import {
  Controller,
  type FieldValues,
  type Control,
  type Path,
} from "react-hook-form";
import type { ReactNode } from "react";

type Props<T extends FieldValues, Option> = Omit<
  AutocompleteProps<Option, false, false, false>,
  "renderInput" | "name" | "defaultValue" | "onChange"
> & {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  defaultValue?: Option | null;
  getOptionLabel: (option: Option) => string;
  inputEndAdornment?: ReactNode;
};

function AutocompleteControlled<T extends FieldValues, Option>({
  name,
  control,
  label,
  defaultValue = null,
  inputEndAdornment,
  ...rest
}: Props<T, Option>) {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue as any}
      render={({ field, fieldState }) => (
        <Autocomplete
          {...rest}
          {...field}
          value={field.value ?? null}
          onChange={(_, value) => field.onChange(value)}
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField
              {...params}
              label={label}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {inputEndAdornment}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      )}
    />
  );
}

export default AutocompleteControlled;
