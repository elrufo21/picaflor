import {
  Controller,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from "react-hook-form";
import { useRef } from "react";
import type { KeyboardEvent } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { showToast } from "@/components/ui/AppToast";

interface ServicesTableProps {
  partidas: { value: string; label: string }[] | undefined;
  hoteles: { value: string; label: string }[] | undefined;
  almuerzos: { value: string; label: string }[] | undefined;
  trasladosOptions: { value: string; label: string }[] | undefined;
  actividades: { value: string; label: string }[] | undefined;
  tarifaRows: any[];
  cantPaxValue: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  errors?: FieldErrors<any>;
  precioError?: boolean;
  updateRow: (
    id: string,
    key: "precioUnit" | "cantidad",
    value: number
  ) => void;
  handleAdvanceAfterChange: (e: any) => void;
  onPartidaChange?: (value: string) => void;
  enableHotelHora?: boolean;
  activitySelections?: Record<string, string | number | undefined>;
}

export const ServicesTable = ({
  partidas,
  hoteles,
  almuerzos,
  trasladosOptions,
  actividades,
  tarifaRows,
  cantPaxValue,
  control,
  register,
  errors,
  precioError = false,
  updateRow,
  handleAdvanceAfterChange,
  onPartidaChange,
  enableHotelHora = false,
  activitySelections,
}: ServicesTableProps) => {
  const horaTemplate = "__:____";
  const digitPositions = [0, 1, 3, 4];
  const editablePositions = [0, 1, 3, 4, 5, 6];
  const maxCantidad = Number(cantPaxValue) || 0;
  const isCantValid = maxCantidad >= 1;
  const otrosPartidasRef = useRef<HTMLInputElement | null>(null);
  const otrosPartidasRegister = register("otrosPartidas");
  const selectedActivityValues = new Set(
    Object.values(activitySelections ?? {})
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
  );
  const isActivityRow = (rowId: string) =>
    rowId === "actividad1" || rowId === "actividad2" || rowId === "actividad3";
  const hasError = (field: string) => Boolean(errors && (errors as any)[field]);
  const puntoPartidaError = hasError("puntoPartida");
  const horaPresentacionError = hasError("horaPresentacion");
  const tarifaTourError = hasError("tarifaTour");
  const errorBorderClass = "border-rose-500 focus:ring-rose-500";
  const getActivityOptions = (rowId: string) => {
    const currentValue = String(activitySelections?.[rowId] ?? "").trim();
    return (actividades ?? []).filter((opt) => {
      const optValue = String(opt.value);
      if (!optValue) return false;
      if (optValue === currentValue) return true;
      return !selectedActivityValues.has(optValue);
    });
  };
  const notifyCantRequired = () => {
    showToast({
      title: "Atencion",
      description: "Ingresa la cantidad de pax antes de seleccionar.",
      type: "warning",
    });
  };
  const notifyCantidadExcede = (maxCantidadValue: number) => {
    showToast({
      title: "Atencion",
      description: `La cantidad no puede ser mayor que ${maxCantidadValue}.`,
      type: "warning",
    });
  };
  const handleArrowNavigate = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const target = e.currentTarget;
    const row = target.closest("tr");
    const cell = target.closest("td");
    if (!row || !cell) return;
    const cellIndex = Array.from(row.children).indexOf(cell);
    const nextRow =
      e.key === "ArrowUp" ? row.previousElementSibling : row.nextElementSibling;
    if (!nextRow || nextRow.tagName !== "TR") return;
    const nextCell = nextRow.children.item(cellIndex) as HTMLElement | null;
    if (!nextCell) return;
    const nextInput = nextCell.querySelector<HTMLElement>("input");
    nextInput?.focus();
  };
  const renderCantGuard = () =>
    !isCantValid ? (
      <button
        type="button"
        className="absolute inset-0 cursor-not-allowed"
        onClick={notifyCantRequired}
        tabIndex={-1}
        aria-label="Cantidad requerida"
      />
    ) : null;

  const buildHoraMask = (value: string | undefined) => {
    const raw = String(value ?? "").toUpperCase();
    if (!raw) return horaTemplate;
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    const chars = horaTemplate.split("");
    digits.split("").forEach((digit, index) => {
      const pos = digitPositions[index];
      if (pos != null) chars[pos] = digit;
    });

    if (raw.includes("AM")) {
      chars[5] = "A";
      chars[6] = "M";
    } else if (raw.includes("PM")) {
      chars[5] = "P";
      chars[6] = "M";
    } else if (raw.includes("A")) {
      chars[5] = "A";
    } else if (raw.includes("P")) {
      chars[5] = "P";
    }

    return chars.join("");
  };

  const clearRange = (mask: string, start: number, end: number) => {
    const chars = mask.split("");
    editablePositions.forEach((pos) => {
      if (pos >= start && pos < end) chars[pos] = "_";
    });
    return chars.join("");
  };

  const findNext = (positions: number[], from: number) =>
    positions.find((pos) => pos >= from);
  const findPrev = (positions: number[], from: number) =>
    [...positions].reverse().find((pos) => pos < from);

  const applyPaste = (mask: string, text: string) => {
    const raw = String(text ?? "").toUpperCase();
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    const chars = mask.split("");
    digits.split("").forEach((digit, index) => {
      const pos = digitPositions[index];
      if (pos != null) chars[pos] = digit;
    });

    if (raw.includes("AM")) {
      chars[5] = "A";
      chars[6] = "M";
    } else if (raw.includes("PM")) {
      chars[5] = "P";
      chars[6] = "M";
    } else if (raw.includes("A")) {
      chars[5] = "A";
    } else if (raw.includes("P")) {
      chars[5] = "P";
    }

    return chars.join("");
  };

  const moveCursorToStart = (input: HTMLInputElement) => {
    const first = editablePositions[0] ?? 0;
    requestAnimationFrame(() => {
      input.setSelectionRange(first, first);
    });
  };

  return (
    <div className="p-2.5">
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <label className="flex flex-col text-sm text-slate-700 md:col-span-3">
            <span className="font-semibold mb-1">Punto partida</span>
            <select
              className={`rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                puntoPartidaError ? errorBorderClass : ""
              }`}
              {...register("puntoPartida", {
                onChange: (e) => {
                  handleAdvanceAfterChange(e);
                  onPartidaChange?.(e.target.value);
                },
                required: "Seleccione punto partida",
              })}
              aria-invalid={puntoPartidaError || undefined}
            >
              <option value="">Seleccione</option>
              <option value="HOTEL">Hotel</option>
              <option value="OTROS">Otros</option>
              {partidas?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm text-slate-700 col-span-2">
            <span className="font-semibold mb-1">Hotel</span>
            <Controller
              name="hotel"
              control={control}
              render={({ field }) => {
                const selectedValue = String(field.value ?? "").trim();
                const selectedOption =
                  hoteles?.find((opt) => String(opt.value) === selectedValue) ??
                  null;
                return (
                  <Autocomplete
                    options={hoteles ?? []}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      option.value === value.value
                    }
                    value={selectedOption}
                    onChange={(e, value) => {
                      field.onChange(value ? value.value : "-");
                      handleAdvanceAfterChange(e as any);
                      if (value) {
                        requestAnimationFrame(() => {
                          otrosPartidasRef.current?.focus();
                        });
                      }
                    }}
                    disabled={!enableHotelHora}
                    size="small"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="-"
                        InputProps={{
                          ...params.InputProps,
                          className:
                            "rounded-lg border border-slate-200 px-2.5 h-[35px]  focus:outline-none focus:ring-2 focus:ring-emerald-500",
                        }}
                      />
                    )}
                  />
                );
              }}
            />
          </label>

          <label className="flex flex-col text-sm text-slate-700 md:col-span-4">
            <span className="font-semibold mb-1">Otros partidas</span>
            <input
              className="rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ingresa punto alterno"
              {...otrosPartidasRegister}
              ref={(el) => {
                otrosPartidasRegister.ref(el);
                otrosPartidasRef.current = el;
              }}
            />
          </label>

          <label className="flex flex-col text-sm text-slate-700">
            <span className="font-semibold mb-1">Hora P.</span>
            <Controller
              name="horaPresentacion"
              control={control}
              render={({ field }) => (
                <input
                  readOnly={!enableHotelHora}
                  value={buildHoraMask(field.value)}
                  onKeyDown={(e) => {
                    if (!enableHotelHora) return;
                    const input = e.currentTarget;
                    const start = input.selectionStart ?? 0;
                    const end = input.selectionEnd ?? 0;
                    const mask = buildHoraMask(field.value);

                    const setValueAndCursor = (
                      nextMask: string,
                      cursor: number
                    ) => {
                      field.onChange(nextMask);
                      requestAnimationFrame(() => {
                        input.setSelectionRange(cursor, cursor);
                      });
                    };

                    if (e.key === "Backspace") {
                      e.preventDefault();
                      if (start !== end) {
                        setValueAndCursor(clearRange(mask, start, end), start);
                        return;
                      }
                      const prev = findPrev(editablePositions, start);
                      if (prev == null) return;
                      const chars = mask.split("");
                      chars[prev] = "_";
                      setValueAndCursor(chars.join(""), prev);
                      return;
                    }

                    if (e.key === "Delete") {
                      e.preventDefault();
                      if (start !== end) {
                        setValueAndCursor(clearRange(mask, start, end), start);
                        return;
                      }
                      const pos = editablePositions.includes(start)
                        ? start
                        : findNext(editablePositions, start);
                      if (pos == null) return;
                      const chars = mask.split("");
                      chars[pos] = "_";
                      setValueAndCursor(chars.join(""), pos);
                      return;
                    }

                    if (/^\d$/.test(e.key)) {
                      e.preventDefault();
                      const pos = findNext(digitPositions, start);
                      if (pos == null) return;
                      const chars = mask.split("");
                      chars[pos] = e.key;
                      const nextPos =
                        findNext(editablePositions, pos + 1) ?? pos + 1;
                      setValueAndCursor(chars.join(""), nextPos);
                      return;
                    }

                    if (/^[aApP]$/.test(e.key)) {
                      e.preventDefault();
                      const chars = mask.split("");
                      chars[5] = e.key.toUpperCase();
                      chars[6] = "M";
                      setValueAndCursor(chars.join(""), 7);
                      return;
                    }

                    if (e.key.length === 1) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    if (!enableHotelHora) return;
                    e.preventDefault();
                    const text = e.clipboardData.getData("text");
                    const nextMask = applyPaste(
                      buildHoraMask(field.value),
                      text
                    );
                    field.onChange(nextMask);
                    requestAnimationFrame(() => {
                      e.currentTarget.setSelectionRange(7, 7);
                    });
                  }}
                  onChange={(e) => {
                    if (!enableHotelHora) return;
                    field.onChange(buildHoraMask(e.target.value));
                  }}
                  maxLength={7}
                  className={`rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    enableHotelHora ? "" : "bg-slate-50 text-slate-600"
                  } ${horaPresentacionError ? errorBorderClass : ""}`}
                  aria-invalid={horaPresentacionError || undefined}
                  onFocus={(e) => {
                    if (!enableHotelHora) return;
                    const target = e.currentTarget;
                    setTimeout(() => {
                      target.setSelectionRange(0, target.value.length);
                    }, 0);
                  }}
                />
              )}
            />
          </label>

          <label className="flex flex-col text-sm text-slate-700 md:col-span-5">
            <span className="font-semibold mb-1">Visitas y excursiones</span>
            <textarea
              className="rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={2}
              {...register("visitas")}
              disabled
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-slate-300 text-xs bg-white">
            <thead>
              <tr className="bg-slate-100">
                <th className="border px-2 py-1 w-28"></th>
                <th className="border px-2 py-1 text-left">Detalle</th>
                <th className="border px-2 py-1 text-center w-30">Precio</th>
                <th className="border px-2 py-1 text-center w-30">Cant</th>
                <th className="border px-2 py-1 text-right w-30">SubTotal</th>
              </tr>
            </thead>

            <tbody>
              {tarifaRows.map((row) => {
                const isTarifaRow = row.id === "tarifaTour";
                const selectError = isTarifaRow && tarifaTourError;
                const precioCellError = isTarifaRow && precioError;
                return (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="border px-2 py-1">
                      <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[11px] font-semibold">
                        {row.label}
                      </span>
                    </td>

                    <td className="border px-2 py-1">
                      {row.type === "select" ? (
                        <div className="relative">
                          <select
                            className={`w-full h-7 rounded border px-1 text-[11px] ${
                              selectError ? errorBorderClass : ""
                            }`}
                            disabled={!isCantValid}
                            {...register(row.id)}
                            aria-invalid={selectError || undefined}
                          >
                            <option value="-">(SELECCIONE)</option>
                            {(row.id === "tarifaTour"
                              ? almuerzos
                              : row.id === "traslados"
                              ? trasladosOptions
                              : isActivityRow(row.id)
                              ? getActivityOptions(row.id)
                              : actividades
                            )?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {renderCantGuard()}
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            className="w-full h-7 text-xl rounded border px-1 text-[11px]"
                            disabled
                            {...register(row.id)}
                          />
                          {renderCantGuard()}
                        </div>
                      )}
                    </td>

                    {/* PRECIO */}
                    <td className="border px-2 py-1">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={row.precioUnit === 0 ? "" : row.precioUnit}
                          disabled={!isCantValid}
                          onKeyDown={handleArrowNavigate}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "") {
                              updateRow(row.id, "precioUnit", 0);
                              return;
                            }
                            updateRow(row.id, "precioUnit", Number(raw));
                          }}
                          className={`w-full h-7 rounded border px-1 text-right text-[16px] ${
                            !isCantValid ? "bg-slate-50 text-slate-600" : ""
                          } ${precioCellError ? errorBorderClass : ""}`}
                          aria-invalid={precioCellError || undefined}
                        />
                        {renderCantGuard()}
                      </div>
                    </td>

                    {/* CANTIDAD */}
                    <td className="border px-2 py-1">
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={maxCantidad || undefined}
                          value={row.cantidad === 0 ? "" : row.cantidad}
                          disabled={!isCantValid}
                          onKeyDown={handleArrowNavigate}
                          onChange={(e) => {
                            if (!isCantValid) return;
                            const raw = e.target.value;
                            if (raw === "") {
                              updateRow(row.id, "cantidad", 0);
                              return;
                            }
                            const next = Number(raw);
                            if (Number.isNaN(next)) {
                              updateRow(row.id, "cantidad", 0);
                              return;
                            }
                            if (maxCantidad > 0 && next > maxCantidad) {
                              notifyCantidadExcede(maxCantidad);
                              updateRow(row.id, "cantidad", maxCantidad);
                              return;
                            }
                            updateRow(row.id, "cantidad", Math.max(next, 0));
                          }}
                          className={`w-full h-7 rounded border px-1 text-center text-[16px] ${
                            !isCantValid ? "bg-slate-50 text-slate-600" : ""
                          }`}
                        />
                        {renderCantGuard()}
                      </div>
                    </td>

                    {/* SUBTOTAL */}
                    <td className="border px-2 py-1 text-right font-semibold text-[16px]">
                      {(row.precioUnit * row.cantidad).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
