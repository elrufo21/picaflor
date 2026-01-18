import Autocomplete, {
  type AutocompleteProps,
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

  /** ✅ NUEVO */
  onValueChange?: (
    value: Option | null,
    helpers: {
      name: Path<T>;
      setNextFocus: () => void;
    },
  ) => void;
};

function AutocompleteControlled<T extends FieldValues, Option>({
  name,
  control,
  label,
  defaultValue = null,
  inputEndAdornment,
  autoAdvance,
  onValueChange,
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

        const focusNext = () => {
          const nextSelector = (rest as any)["data-focus-next"];
          if (nextSelector) {
            setTimeout(() => {
              document.querySelector<HTMLInputElement>(nextSelector)?.focus();
            }, 0);
            return;
          }

          if (autoAdvance) {
            const target = inputElementRef.current;
            setTimeout(() => {
              focusNextElement(target, target?.closest("form"));
            }, 0);
          }
        };

        return (
          <Autocomplete
            {...rest}
            {...fieldProps}
            value={field.value ?? null}
            onChange={(e, value) => {
              // 1️⃣ RHF SIEMPRE primero
              onChange(value);

              // 2️⃣ lógica adicional opcional
              onValueChange?.(value, {
                name,
                setNextFocus: focusNext,
              });

              // 3️⃣ auto focus (si no fue manejado afuera)
              focusNext();
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
