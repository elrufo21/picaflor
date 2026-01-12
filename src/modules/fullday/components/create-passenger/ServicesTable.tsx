import { Controller, type Control, type UseFormRegister } from "react-hook-form";

interface ServicesTableProps {
  partidas: { value: string; label: string }[] | undefined;
  hoteles: { value: string; label: string }[] | undefined;
  almuerzos: { value: string; label: string }[] | undefined;
  trasladosOptions: { value: string; label: string }[] | undefined;
  actividades: { value: string; label: string }[] | undefined;
  tarifaRows: any[];
  control: Control<any>;
  register: UseFormRegister<any>;
  updateRow: (
    id: string,
    key: "precioUnit" | "cantidad",
    value: number
  ) => void;
  handleAdvanceAfterChange: (e: any) => void;
  onPartidaChange?: (value: string) => void;
  enableHotelHora?: boolean;
}

export const ServicesTable = ({
  partidas,
  hoteles,
  almuerzos,
  trasladosOptions,
  actividades,
  tarifaRows,
  control,
  register,
  updateRow,
  handleAdvanceAfterChange,
  onPartidaChange,
  enableHotelHora = false,
}: ServicesTableProps) => {
  const horaTemplate = "__:____";
  const digitPositions = [0, 1, 3, 4];
  const editablePositions = [0, 1, 3, 4, 5, 6];

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

  return (
    <div className="p-2.5">
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <label className="flex flex-col text-sm text-slate-700 md:col-span-3">
            <span className="font-semibold mb-1">Punto partida</span>
            <select
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              {...register("puntoPartida", {
                onChange: (e) => {
                  handleAdvanceAfterChange(e);
                  onPartidaChange?.(e.target.value);
                },
                required: "Seleccione punto partida",
              })}
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
            <select
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={!enableHotelHora}
              {...register("hotel", {
                onChange: handleAdvanceAfterChange,
              })}
            >
              <option value="-">-</option>
              {hoteles?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm text-slate-700 md:col-span-4">
            <span className="font-semibold mb-1">Otros partidas</span>
            <input
              className="rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ingresa punto alterno"
              {...register("otrosPartidas")}
            />
          </label>

          <label className="flex flex-col text-sm text-slate-700">
            <span className="font-semibold mb-1">Hora P.</span>
            <Controller
              name="horaPresentacion"
              control={control}
              render={({ field }) => (
                <input
                  placeholder="__:____"
                  readOnly={!enableHotelHora}
                  value={buildHoraMask(field.value)}
                  onKeyDown={(e) => {
                    if (!enableHotelHora) return;
                    const input = e.currentTarget;
                    const start = input.selectionStart ?? 0;
                    const end = input.selectionEnd ?? 0;
                    const mask = buildHoraMask(field.value);

                    const setValueAndCursor = (nextMask: string, cursor: number) => {
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
                      const nextPos = findNext(editablePositions, pos + 1) ?? pos + 1;
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
                    const nextMask = applyPaste(buildHoraMask(field.value), text);
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
                  }`}
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
              {tarifaRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  {/* LABEL */}
                  <td className="border px-2 py-1">
                    <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[11px] font-semibold">
                      {row.label}
                    </span>
                  </td>

                  {/* SELECT / INPUT */}
                  <td className="border px-2 py-1">
                    {row.type === "select" ? (
                      <select
                        className="w-full h-7 rounded border px-1 text-[11px]"
                        {...register(row.id)}
                      >
                        <option value="-">(SELECCIONE)</option>
                        {(row.id === "tarifaTour"
                          ? almuerzos
                          : row.id === "traslados"
                          ? trasladosOptions
                          : actividades
                        )?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="w-full h-7 rounded border px-1 text-[11px]"
                        {...register(row.id)}
                      />
                    )}
                  </td>

                  {/* PRECIO */}
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      value={row.precioUnit}
                      onChange={(e) =>
                        updateRow(row.id, "precioUnit", Number(e.target.value))
                      }
                      className="w-full h-7 rounded border px-1 text-right text-[11px]"
                    />
                  </td>

                  {/* CANTIDAD */}
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      value={row.cantidad}
                      readOnly
                      className="w-full h-7 rounded border px-1 text-center text-[11px] bg-slate-50 text-slate-600"
                    />
                  </td>

                  {/* SUBTOTAL */}
                  <td className="border px-2 py-1 text-right font-semibold">
                    {(row.precioUnit * row.cantidad).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
