import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { type Dayjs } from "dayjs";

const DISPLAY_FORMAT = "hh:mm A";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
};

const toDayjs = (value?: string): Dayjs | null => {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  const parsed = dayjs(normalized, [DISPLAY_FORMAT, "hh:mmA", "HH:mm"], true);
  return parsed.isValid() ? parsed : null;
};

function TableTimePicker({
  value = "",
  onChange,
  placeholder = "07:30AM",
  disabled = false,
  compact = false,
}: Props) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        value={toDayjs(value)}
        onChange={(next) => onChange(next?.format(DISPLAY_FORMAT) ?? "")}
        disabled={disabled}
        slotProps={{
          textField: {
            size: "small",
            placeholder,
            sx: compact
              ? {
                  width: 150,
                  "& input": {
                    fontSize: 10,
                    px: 1.25,
                    pr: 0.5,
                  },
                }
              : undefined,
          },
        }}
      />
    </LocalizationProvider>
  );
}

export default TableTimePicker;
