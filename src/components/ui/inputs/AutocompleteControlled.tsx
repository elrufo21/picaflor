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
import { useRef, type ReactNode } from "react";
import { focusNextElement } from "@/shared/helpers/formFocus";

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
  autoAdvance?: boolean;
};

function AutocompleteControlled<T extends FieldValues, Option>({
  name,
  control,
  label,
  defaultValue = null,
  inputEndAdornment,
  autoAdvance,
  ...rest
}: Props<T, Option>) {
  const inputElementRef = useRef<HTMLInputElement | null>(null);

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue as any}
      render={({ field, fieldState }) => {
        const { ref, onChange, ...fieldProps } = field;
        const handleInputRef = (node: HTMLInputElement | null) => {
          ref(node);
          inputElementRef.current = node;
        };
        return (
        <Autocomplete
          {...rest}
          {...fieldProps}
          value={field.value ?? null}
          onChange={(e, value) => {
            onChange(value);

            const nextSelector = (rest as any)["data-focus-next"];
            if (nextSelector) {
              setTimeout(() => {
                const next =
                  document.querySelector<HTMLInputElement>(nextSelector);
                next?.focus();
              }, 0);
              return;
            }
            if (autoAdvance) {
              const target = inputElementRef.current;
              setTimeout(() => {
                focusNextElement(target, target?.closest("form"));
              }, 0);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={handleInputRef}
              label={label}
              error={!!fieldState.error}
              helperText={(rest as any).helperText}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {inputEndAdornment}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      );
      }}
    />
  );
}

export default AutocompleteControlled;
