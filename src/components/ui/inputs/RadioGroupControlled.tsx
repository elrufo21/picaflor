import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import FormHelperText from "@mui/material/FormHelperText";
import {
  Controller,
  type FieldValues,
  type Control,
  type Path,
} from "react-hook-form";

type Option = { label: string; value: string | number };

type Props<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  options: Option[];
  row?: boolean;
  defaultValue?: T[Path<T>];
};

function RadioGroupControlled<T extends FieldValues>({
  name,
  control,
  label,
  options,
  row,
  defaultValue,
}: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <FormControl
          error={!!fieldState.error}
          component="fieldset"
          sx={{ width: "100%" }}
        >
          {label && <FormLabel component="legend">{label}</FormLabel>}
          <RadioGroup {...field} row={row}>
            {options.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio />}
                label={opt.label}
              />
            ))}
          </RadioGroup>
          {fieldState.error && (
            <FormHelperText>{fieldState.error.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}

export default RadioGroupControlled;
