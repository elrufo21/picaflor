export const cellHighlightOptions = [
  { value: "AMBAR", label: "Ámbar", swatchClassName: "bg-amber-300", cellClassName: "bg-amber-100", inputClassName: "!bg-amber-50" },
  { value: "AZUL", label: "Azul", swatchClassName: "bg-sky-300", cellClassName: "bg-sky-100", inputClassName: "!bg-sky-50" },
  { value: "VERDE", label: "Verde", swatchClassName: "bg-emerald-300", cellClassName: "bg-emerald-100", inputClassName: "!bg-emerald-50" },
  { value: "ROSA", label: "Rosa", swatchClassName: "bg-rose-300", cellClassName: "bg-rose-100", inputClassName: "!bg-rose-50" },
  { value: "MORADO", label: "Morado", swatchClassName: "bg-violet-300", cellClassName: "bg-violet-100", inputClassName: "!bg-violet-50" },
] as const;

export type CellHighlightColor = (typeof cellHighlightOptions)[number]["value"];

export const getCellHighlightStyle = (color?: string) =>
  cellHighlightOptions.find((option) => option.value === color);

export const cellTextColorOptions = [
  { value: "NEGRO", label: "Negro", className: "!text-slate-900", color: "#0f172a" },
  { value: "AZUL", label: "Azul", className: "!text-sky-700", color: "#0369a1" },
  { value: "VERDE", label: "Verde", className: "!text-emerald-700", color: "#047857" },
  { value: "ROJO", label: "Rojo", className: "!text-rose-700", color: "#be123c" },
  { value: "MORADO", label: "Morado", className: "!text-violet-700", color: "#6d28d9" },
  { value: "BLANCO", label: "Blanco", className: "!text-white", color: "#ffffff" },
] as const;

export type CellTextColor = (typeof cellTextColorOptions)[number]["value"];

export const getCellTextStyle = (color?: string) =>
  cellTextColorOptions.find((option) => option.value === color);
