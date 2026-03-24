import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
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

const ROOM_ASCENDING_ORDER = [
  "simple",
  "doble",
  "triple",
  "cuadruple",
  "quintuple",
  "matrimonial",
  "familiar",
  "suite",
  "junior suite",
];

const ROOM_ORDER_INDEX = new Map(
  ROOM_ASCENDING_ORDER.map((value, index) => [value, index]),
);

const normalizeRoomKey = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const sortRoomOptions = (options: RoomOption[]) =>
  [...options].sort((a, b) => {
    const aOrder =
      ROOM_ORDER_INDEX.get(normalizeRoomKey(a.value)) ??
      ROOM_ORDER_INDEX.get(normalizeRoomKey(a.label)) ??
      9999;
    const bOrder =
      ROOM_ORDER_INDEX.get(normalizeRoomKey(b.value)) ??
      ROOM_ORDER_INDEX.get(normalizeRoomKey(b.label)) ??
      9999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.label.localeCompare(b.label);
  });

const toSummary = (
  value: RoomQuantityValue[],
  options: RoomOption[],
  currencySymbol: string,
) => {
  const selected = value.filter((item) => item.quantity > 0);
  if (!selected.length) return "";
  const totalRooms = selected.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = selected.reduce(
    (acc, item) => acc + item.quantity * Number(item.price || 0),
    0,
  );
  return `${currencySymbol} ${formatPrice(totalAmount)} | ${selected.length} tipos | ${totalRooms} hab |`;
};

const sortByOptions = (value: RoomQuantityValue[], options: RoomOption[]) => {
  const orderedOptions = sortRoomOptions(options);
  const order = new Map(
    orderedOptions.map((option, index) => [option.value, index]),
  );
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
  const inputNamespaceRef = useRef(
    `room-selector-${Math.random().toString(36).slice(2, 10)}`,
  );
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const quantityInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const priceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pendingPriceFocusOptionRef = useRef<string | null>(null);

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
    const orderedOptions = sortRoomOptions(options);
    const selectedSet = new Set(selected.map((item) => item.value));
    const selectedOptions = orderedOptions.filter((option) =>
      selectedSet.has(option.value),
    );
    const unselectedOptions = orderedOptions.filter(
      (option) => !selectedSet.has(option.value),
    );
    return [...selectedOptions, ...unselectedOptions];
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
      pendingPriceFocusOptionRef.current = optionValue;
      const current = getCurrentQuantity(optionValue);
      const currentPrice = getCurrentPrice(optionValue);
      setRoomValue(optionValue, {
        quantity: current > 0 ? current : 1,
        price: currentPrice,
      });
      return;
    }
    if (pendingPriceFocusOptionRef.current === optionValue) {
      pendingPriceFocusOptionRef.current = null;
    }
    setRoomValue(optionValue, { quantity: 0 });
  };

  const clearAll = () => onChange([]);

  useEffect(() => {
    const optionValue = pendingPriceFocusOptionRef.current;
    if (!optionValue) return;
    if (getCurrentQuantity(optionValue) <= 0) return;

    const priceInput = priceInputRefs.current[optionValue];
    if (!priceInput) return;

    priceInput.focus();
    priceInput.select();
    pendingPriceFocusOptionRef.current = null;
  }, [value]);

  const focusColumnInput = (
    optionValue: string,
    column: "quantity" | "price",
    direction: "up" | "down",
  ) => {
    const enabledValues = displayOptions
      .map((option) => option.value)
      .filter((value) => getCurrentQuantity(value) > 0);
    const currentIndex = enabledValues.indexOf(optionValue);
    if (currentIndex < 0) return;

    const nextIndex =
      direction === "down" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= enabledValues.length) return;

    const nextOptionValue = enabledValues[nextIndex];
    const nextInput =
      column === "quantity"
        ? quantityInputRefs.current[nextOptionValue]
        : priceInputRefs.current[nextOptionValue];
    nextInput?.focus();
    nextInput?.select();
  };

  const handleColumnNavigation = (
    event: KeyboardEvent<HTMLInputElement>,
    optionValue: string,
    column: "quantity" | "price",
  ) => {
    if (event.key !== "Enter" && event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }
    event.preventDefault();
    const direction = event.key === "ArrowUp" ? "up" : "down";
    focusColumnInput(optionValue, column, direction);
  };

  return (
    <>
      <TextField
        fullWidth
        size="small"
        id={`${inputNamespaceRef.current}-summary`}
        value={summary}
        autoComplete="new-password"
        onClick={(event) => {
          if (!disabled) setAnchorEl(event.currentTarget);
        }}
        placeholder={placeholder}
        inputProps={{
          readOnly: true,
          autoComplete: "new-password",
          name: `${inputNamespaceRef.current}-summary`,
          "data-lpignore": "true",
          "data-1p-ignore": "true",
          "data-form-type": "other",
        }}
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
        <Box
          component="form"
          autoComplete="new-password"
          noValidate
          className="w-[530px] max-h-[70vh] overflow-y-auto p-3 space-y-2"
        >
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
                    id={`${inputNamespaceRef.current}-${normalizeRoomKey(
                      option.value,
                    )}-quantity`}
                    autoComplete="new-password"
                    value={checked ? quantity : ""}
                    onChange={(event) =>
                      setRoomValue(option.value, {
                        quantity: Number(event.target.value),
                      })
                    }
                    disabled={!checked}
                    sx={{ width: 60 }}
                    onKeyDown={(event) =>
                      handleColumnNavigation(event, option.value, "quantity")
                    }
                    inputRef={(element: HTMLInputElement | null) => {
                      quantityInputRefs.current[option.value] = element;
                    }}
                    inputProps={{
                      min: 0,
                      autoComplete: "new-password",
                      name: `${inputNamespaceRef.current}-${normalizeRoomKey(
                        option.value,
                      )}-quantity`,
                      "data-lpignore": "true",
                      "data-1p-ignore": "true",
                      "data-form-type": "other",
                    }}
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
                  id={`${inputNamespaceRef.current}-${normalizeRoomKey(
                    option.value,
                  )}-price`}
                  autoComplete="new-password"
                  value={checked && price > 0 ? price : ""}
                  onChange={(event) =>
                    setRoomValue(option.value, {
                      price: Number(event.target.value),
                    })
                  }
                  disabled={!checked}
                  sx={{ width: 130 }}
                  onKeyDown={(event) =>
                    handleColumnNavigation(event, option.value, "price")
                  }
                  inputRef={(element: HTMLInputElement | null) => {
                    priceInputRefs.current[option.value] = element;
                  }}
                  inputProps={{
                    min: 0,
                    step: "0.01",
                    autoComplete: "new-password",
                    name: `${inputNamespaceRef.current}-${normalizeRoomKey(
                      option.value,
                    )}-price`,
                    "data-lpignore": "true",
                    "data-1p-ignore": "true",
                    "data-form-type": "other",
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
