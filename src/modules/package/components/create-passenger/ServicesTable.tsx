import type { UseFormRegister } from "react-hook-form";

interface ServicesTableProps {
  partidas: { value: string; label: string }[] | undefined;
  hoteles: { value: string; label: string }[] | undefined;
  almuerzos: { value: string; label: string }[] | undefined;
  trasladosOptions: { value: string; label: string }[] | undefined;
  actividades: { value: string; label: string }[] | undefined;
  tarifaRows: any[];
  register: UseFormRegister<any>;
  updateRow: (id: string, key: "precioUnit" | "cantidad", value: number) => void;
  handleAdvanceAfterChange: (e: any) => void;
}

export const ServicesTable = ({
  partidas,
  hoteles,
  almuerzos,
  trasladosOptions,
  actividades,
  tarifaRows,
  register,
  updateRow,
  handleAdvanceAfterChange,
}: ServicesTableProps) => {
  return (
    <div className="p-2.5">
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <label className="flex flex-col text-sm text-slate-700">
            <span className="font-semibold mb-1">Punto partida</span>
            <select
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              {...register("puntoPartida", {
                onChange: handleAdvanceAfterChange,
              })}
            >
              {partidas?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm text-slate-700">
            <span className="font-semibold mb-1">Hotel</span>
            <select
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              {...register("hotel", {
                onChange: handleAdvanceAfterChange,
              })}
            >
              {hoteles?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
            <span className="font-semibold mb-1">Otros partidas</span>
            <input
              className="rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ingresa punto alterno"
              {...register("otrosPartidas")}
            />
          </label>

          <label className="flex flex-col text-sm text-slate-700">
            <span className="font-semibold mb-1">Hora P.</span>
            <input
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="HH:MM"
              {...register("horaPresentacion")}
            />
          </label>

          <label className="flex flex-col text-sm text-slate-700 md:col-span-3">
            <span className="font-semibold mb-1">
              Visitas y excursiones
            </span>
            <textarea
              className="rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={2}
              {...register("visitas")}
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-slate-300 text-xs bg-white">
            <thead>
              <tr className="bg-slate-100">
                <th className="border px-2 py-1 w-40"></th>
                <th className="border px-2 py-1 text-left">Detalle</th>
                <th className="border px-2 py-1 text-center w-20">
                  Precio
                </th>
                <th className="border px-2 py-1 text-center w-16">
                  Cant
                </th>
                <th className="border px-2 py-1 text-right w-20">
                  SubTotal
                </th>
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
                        updateRow(
                          row.id,
                          "precioUnit",
                          Number(e.target.value)
                        )
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
                      onChange={(e) =>
                        updateRow(
                          row.id,
                          "cantidad",
                          Number(e.target.value)
                        )
                      }
                      className="w-full h-7 rounded border px-1 text-center text-[11px]"
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
