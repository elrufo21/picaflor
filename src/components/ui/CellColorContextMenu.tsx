import { useEffect } from "react";
import {
  cellHighlightOptions,
  cellTextColorOptions,
  type CellTextColor,
  type CellHighlightColor,
} from "./cellHighlight";

type CellColorStyle = { background?: string; text?: string };

type Props = {
  position: { x: number; y: number } | null;
  value?: CellColorStyle;
  onChange: (patch: {
    background?: CellHighlightColor | "";
    text?: CellTextColor | "";
  }) => void;
  onClose: () => void;
};

export default function CellColorContextMenu({
  position,
  value,
  onChange,
  onClose,
}: Props) {
  useEffect(() => {
    if (!position) return;

    const close = () => onClose();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [position, onClose]);

  if (!position) return null;

  return (
    <div
      role="menu"
      aria-label="Color de celda"
      onMouseDown={(event) => event.stopPropagation()}
      className="fixed z-50 min-w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
      style={{ left: position.x, top: position.y }}
    >
      <p className="px-2 py-1 text-xs font-medium text-slate-500">
        Resaltar celda
      </p>
      {cellHighlightOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          role="menuitemradio"
          aria-checked={value?.background === option.value}
          onClick={() => onChange({ background: option.value })}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
        >
          <span className={`h-3 w-3 rounded-full ${option.swatchClassName}`} />
          {option.label}
        </button>
      ))}
      <button
        type="button"
        role="menuitem"
        onClick={() => onChange({ background: "" })}
        className="mt-1 w-full border-t border-slate-100 px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-100"
      >
        Quitar fondo
      </button>
      <p className="mt-1 border-t border-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
        Color de texto
      </p>
      {cellTextColorOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          role="menuitemradio"
          aria-checked={value?.text === option.value}
          onClick={() => onChange({ text: option.value })}
          className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100 ${option.className}`}
        >
          <span className={`h-3 w-3 rounded-full bg-current`} />
          {option.label}
        </button>
      ))}
      <button
        type="button"
        role="menuitem"
        onClick={() => onChange({ text: "" })}
        className="mt-1 w-full border-t border-slate-100 px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-100"
      >
        Texto predeterminado
      </button>
    </div>
  );
}
