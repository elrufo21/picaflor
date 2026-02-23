import { useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  IconButton,
  InputAdornment,
  Popover,
  TextField,
  Typography,
} from "@mui/material";
import { Minus, Plus } from "lucide-react";

export type RoomQuantityValue = {
  value: string;
  quantity: number;
};

type RoomOption = {
  value: string;
  label: string;
};

type Props = {
  options: RoomOption[];
  value: RoomQuantityValue[];
  onChange: (value: RoomQuantityValue[]) => void;
  placeholder?: string;
  disabled?: boolean;
};

const toSummary = (value: RoomQuantityValue[], options: RoomOption[]) => {
  const byValue = new Map(options.map((option) => [option.value, option.label]));
  const selected = value.filter((item) => item.quantity > 0);
  if (!selected.length) return "";
  return selected
    .map((item) => `${item.quantity} ${byValue.get(item.value) ?? item.value}`)
    .join(", ");
};

const sortByOptions = (value: RoomQuantityValue[], options: RoomOption[]) => {
  const order = new Map(options.map((option, index) => [option.value, index]));
  return [...value].sort(
    (a, b) => (order.get(a.value) ?? 9999) - (order.get(b.value) ?? 9999),
  );
};

const RoomQuantitySelector = ({
  options,
  value,
  onChange,
  placeholder = "Selecciona habitaciones",
  disabled = false,
}: Props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const summary = useMemo(() => toSummary(value, options), [value, options]);
  const open = Boolean(anchorEl);

  const getCurrentQuantity = (optionValue: string) =>
    value.find((item) => item.value === optionValue)?.quantity ?? 0;

  const setQuantity = (optionValue: string, quantity: number) => {
    const normalized = Math.max(0, Math.floor(quantity));
    const others = value.filter((item) => item.value !== optionValue);
    const next =
      normalized > 0
        ? [...others, { value: optionValue, quantity: normalized }]
        : others;
    onChange(sortByOptions(next, options));
  };

  const toggleOption = (optionValue: string, checked: boolean) => {
    if (checked) {
      const current = getCurrentQuantity(optionValue);
      setQuantity(optionValue, current > 0 ? current : 1);
      return;
    }
    setQuantity(optionValue, 0);
  };

  return (
    <>
      <TextField
        fullWidth
        size="small"
        value={summary}
        onClick={(event) => {
          if (!disabled) setAnchorEl(event.currentTarget);
        }}
        placeholder={placeholder}
        inputProps={{ readOnly: true }}
        disabled={disabled}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Plus className="h-4 w-4 text-slate-500" />
            </InputAdornment>
          ),
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box className="w-[320px] p-3 space-y-2">
          <Typography variant="subtitle2" className="font-semibold">
            Tipos de habitación
          </Typography>

          {options.map((option) => {
            const quantity = getCurrentQuantity(option.value);
            const checked = quantity > 0;
            return (
              <Box
                key={option.value}
                className="grid grid-cols-[1fr_auto] items-center gap-2"
              >
                <label className="inline-flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onChange={(event) =>
                      toggleOption(option.value, event.target.checked)
                    }
                    size="small"
                  />
                  {option.label}
                </label>

                <Box className="inline-flex items-center gap-1">
                  <IconButton
                    size="small"
                    onClick={() => setQuantity(option.value, quantity - 1)}
                    disabled={!checked}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </IconButton>
                  <TextField
                    size="small"
                    type="number"
                    value={checked ? quantity : 0}
                    onChange={(event) =>
                      setQuantity(option.value, Number(event.target.value))
                    }
                    disabled={!checked}
                    sx={{ width: 70 }}
                    inputProps={{ min: 0 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setQuantity(option.value, quantity + 1)}
                    disabled={!checked}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Popover>
    </>
  );
};

export default RoomQuantitySelector;
