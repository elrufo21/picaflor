import { Controller, type ControllerProps, type FieldValues, type Control, type Path } from "react-hook-form";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker, type TimePickerProps } from "@mui/x-date-pickers/TimePicker";
import dayjs, { type Dayjs } from "dayjs";

const TIME_PATTERN = /^(0[1-9]|1[0-2]):[0-5][0-9](AM|PM)$/;
const DISPLAY_FORMAT = "hh:mmA";

type Props<T extends FieldValues> = Omit<TimePickerProps<Dayjs>, "value" | "onChange"> & {
  name: Path<T>;
  control: Control<T>;
  defaultValue?: string;
  rules?: ControllerProps["rules"];
  placeholder?: string;
};

const toDayjs = (value?: string): Dayjs | null => {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  const parsed = dayjs(normalized, DISPLAY_FORMAT, true);
  if (parsed.isValid()) return parsed;
  return null;
};

function TimePickerControlled<T extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  placeholder = "07:30AM",
  helperText,
  ...rest
}: Props<T>) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue ?? ""}
        rules={
          rules ?? {
            pattern: {
              value: TIME_PATTERN,
              message: "Formato hh:mmAM/PM",
            },
            required: "Campo requerido",
          }
        }
        render={({ field, fieldState }) => {
          const nextValue = toDayjs(field.value);
          return (
            <TimePicker
              {...rest}
              value={nextValue}
              onChange={(next) => {
                const nextStr = next?.format(DISPLAY_FORMAT) ?? "";
                field.onChange(nextStr);
              }}
              slotProps={{
                textField: {
                  helperText: fieldState.error?.message ?? helperText,
                  error: !!fieldState.error,
                  placeholder,
                  inputProps: {
                    pattern: TIME_PATTERN.source,
                    maxLength: 7,
                  },
                  ...rest.slotProps?.textField,
                },
              }}
              sx={{ width: "100%" }}
            />
          );
        }}
      />
    </LocalizationProvider>
  );
}

export default TimePickerControlled;
