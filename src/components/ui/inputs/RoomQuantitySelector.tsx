import { useMemo, useState } from "react";
import {
  Box,
  Button,
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
  price: number;
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
  currencySymbol?: string;
};

const formatPrice = (price: number) => {
  const normalized = Number.isFinite(price) ? Math.max(0, price) : 0;
  return Number.isInteger(normalized)
    ? String(normalized)
    : normalized.toFixed(2);
};

const toSummary = (
  value: RoomQuantityValue[],
  options: RoomOption[],
  currencySymbol: string,
) => {
  const byValue = new Map(
    options.map((option) => [option.value, option.label]),
  );
  const selected = value.filter((item) => item.quantity > 0);
  if (!selected.length) return "";
  const totalRooms = selected.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = selected.reduce(
    (acc, item) => acc + item.quantity * Number(item.price || 0),
    0,
  );
  return `${selected.length} tipos | ${totalRooms} hab | ${currencySymbol} ${formatPrice(totalAmount)}`;
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
  currencySymbol = "USD$",
}: Props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const summary = useMemo(
    () => toSummary(value, options, currencySymbol),
    [value, options, currencySymbol],
  );
  const open = Boolean(anchorEl);
  const selected = value.filter((item) => item.quantity > 0);
  const totals = useMemo(
    () => ({
      rooms: selected.reduce((acc, item) => acc + item.quantity, 0),
      amount: selected.reduce(
        (acc, item) => acc + item.quantity * Number(item.price || 0),
        0,
      ),
    }),
    [selected],
  );
  const displayOptions = useMemo(() => {
    const selectedSet = new Set(selected.map((item) => item.value));
    return [...options].sort((a, b) => {
      const aSel = selectedSet.has(a.value) ? 0 : 1;
      const bSel = selectedSet.has(b.value) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return a.label.localeCompare(b.label);
    });
  }, [options, selected]);

  const getCurrentQuantity = (optionValue: string) =>
    value.find((item) => item.value === optionValue)?.quantity ?? 0;
  const getCurrentPrice = (optionValue: string) =>
    value.find((item) => item.value === optionValue)?.price ?? 0;

  const setRoomValue = (
    optionValue: string,
    nextValues: { quantity?: number; price?: number },
  ) => {
    const current = value.find((item) => item.value === optionValue);
    const quantity = Math.max(
      0,
      Math.floor(nextValues.quantity ?? current?.quantity ?? 0),
    );
    const price = Math.max(0, Number(nextValues.price ?? current?.price ?? 0));
    const others = value.filter((item) => item.value !== optionValue);
    const next =
      quantity > 0
        ? [...others, { value: optionValue, quantity, price }]
        : others;
    onChange(sortByOptions(next, options));
  };

  const toggleOption = (optionValue: string, checked: boolean) => {
    if (checked) {
      const current = getCurrentQuantity(optionValue);
      const currentPrice = getCurrentPrice(optionValue);
      setRoomValue(optionValue, {
        quantity: current > 0 ? current : 1,
        price: currentPrice,
      });
      return;
    }
    setRoomValue(optionValue, { quantity: 0 });
  };

  const clearAll = () => onChange([]);

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
        <Box className="w-[530px] max-h-[70vh] overflow-y-auto p-3 space-y-2">
          <Box className="flex items-center justify-between">
            <Typography variant="subtitle2" className="font-semibold">
              Tipos de habitacion
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={clearAll}
              disabled={!selected.length}
            >
              Limpiar
            </Button>
          </Box>
          <Typography variant="caption" className="text-slate-600">
            {`${totals.rooms} habitaciones seleccionadas | ${currencySymbol} ${formatPrice(
              totals.amount,
            )}`}
          </Typography>

          {displayOptions.map((option) => {
            const quantity = getCurrentQuantity(option.value);
            const checked = quantity > 0;
            const price = getCurrentPrice(option.value);
            const subtotal = quantity * price;
            return (
              <Box
                key={option.value}
                className="rounded-md border border-slate-200 bg-white p-2 grid grid-cols-[1fr_auto_auto_auto] items-center gap-2"
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
                    onClick={() =>
                      setRoomValue(option.value, { quantity: quantity - 1 })
                    }
                    disabled={!checked}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </IconButton>
                  <TextField
                    size="small"
                    type="number"
                    value={checked ? quantity : ""}
                    onChange={(event) =>
                      setRoomValue(option.value, {
                        quantity: Number(event.target.value),
                      })
                    }
                    disabled={!checked}
                    sx={{ width: 60 }}
                    inputProps={{ min: 0 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() =>
                      setRoomValue(option.value, { quantity: quantity + 1 })
                    }
                    disabled={!checked}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </IconButton>
                </Box>

                <TextField
                  size="small"
                  type="number"
                  value={checked && price > 0 ? price : ""}
                  onChange={(event) =>
                    setRoomValue(option.value, {
                      price: Number(event.target.value),
                    })
                  }
                  disabled={!checked}
                  sx={{ width: 130 }}
                  inputProps={{
                    min: 0,
                    step: "0.01",
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {currencySymbol}
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography
                  variant="caption"
                  className="text-right text-slate-700 font-medium min-w-[84px]"
                >
                  {`${currencySymbol} ${formatPrice(subtotal)}`}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Popover>
    </>
  );
};

export default RoomQuantitySelector;
