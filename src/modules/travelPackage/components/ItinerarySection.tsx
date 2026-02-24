import { Autocomplete, TextField } from "@mui/material";
import { Route } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  serviciosDB,
  type Actividad,
  type PrecioActividad,
  type PrecioTraslado,
  type Producto,
  type Traslado,
} from "@/app/db/serviciosDB";
import { TextControlled } from "@/components/ui/inputs";
import type {
  ItineraryDayRow,
  ItineraryActivityRow,
} from "../types/travelPackage.types";
import SectionCard from "./SectionCard";

dayjs.locale("es");

type Props = {
  itinerario: ItineraryDayRow[];
  cantPax: string;
  onUpdateDayField: <
    K extends keyof Omit<ItineraryDayRow, "id" | "actividades">,
  >(
    id: number,
    field: K,
    value: ItineraryDayRow[K],
  ) => void;
  onAddDay: () => void;
  onRemoveDay: (id: number) => void;
  onAddEvent: (dayId: number) => void;
  onRemoveEvent: (dayId: number, eventId: number) => void;
  onUpdateEventField: (
    dayId: number,
    eventId: number,
    field: keyof Omit<ItineraryActivityRow, "id">,
    value: string | number,
  ) => void;
};

const ROW_TYPES: ItineraryActivityRow["tipo"][] = [
  "ACT1",
  "ACT2",
  "ACT3",
  "TRASLADO",
  "ENTRADA",
];

const ROW_LABELS: Record<ItineraryActivityRow["tipo"], string> = {
  ACT1: "Actividad 1",
  ACT2: "Actividad 2",
  ACT3: "Actividad 3",
  TRASLADO: "Traslados",
  ENTRADA: "Entradas",
};

type ItinerarySectionFormValues = Record<string, string>;

const round2 = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const ItinerarySection = ({
  itinerario,
  cantPax,
  onUpdateDayField,
  onAddDay,
  onRemoveDay,
  onAddEvent,
  onRemoveEvent,
  onUpdateEventField,
}: Props) => {
  void onAddDay;
  void onRemoveDay;
  void onAddEvent;
  void onRemoveEvent;

  const [productos, setProductos] = useState<Producto[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [traslados, setTraslados] = useState<Traslado[]>([]);
  const [preciosActividades, setPreciosActividades] = useState<
    PrecioActividad[]
  >([]);
  const [preciosTraslado, setPreciosTraslado] = useState<PrecioTraslado[]>([]);
  const { control, setValue } = useForm<ItinerarySectionFormValues>({
    defaultValues: {},
  });

  const paxCount = Math.max(0, Number(cantPax || 0));

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      const [
        productosRows,
        actividadesRows,
        trasladosRows,
        preciosActividadesRows,
        preciosTrasladoRows,
      ] = await Promise.all([
        serviciosDB.productos.toArray(),
        serviciosDB.actividades.toArray(),
        serviciosDB.traslados.toArray(),
        serviciosDB.preciosActividades.toArray(),
        serviciosDB.preciosTraslado.toArray(),
      ]);

      if (!active) return;

      setProductos(productosRows);
      setActividades(actividadesRows);
      setTraslados(trasladosRows);
      setPreciosActividades(preciosActividadesRows);
      setPreciosTraslado(preciosTrasladoRows);
    };

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  const productNames = useMemo(
    () => productos.map((producto) => producto.nombre),
    [productos],
  );

  const trasladoNames = useMemo(
    () => traslados.map((traslado) => traslado.nombre),
    [traslados],
  );
  const getProductByTitle = (title: string) =>
    productos.find(
      (producto) =>
        String(producto.nombre).trim().toLowerCase() ===
        String(title ?? "")
          .trim()
          .toLowerCase(),
    );

  const getObservationFieldName = (dayId: number) => `observacion_${dayId}`;

  useEffect(() => {
    itinerario.forEach((day) => {
      setValue(getObservationFieldName(day.id), day.observacion ?? "");
    });
  }, [itinerario, setValue]);

  useEffect(() => {
    itinerario.forEach((day) => {
      day.actividades.forEach((row) => {
        if (!row?.id || row.id <= 0) return;
        const detalle = String(row.detalle ?? "").trim();
        const isActive =
          row.tipo === "ENTRADA"
            ? detalle !== ""
            : detalle !== "" && detalle !== "-";
        if (!isActive) return;
        if (Number(row.cant || 0) === paxCount) return;

        const precio = Number(row.precio || 0);
        onUpdateEventField(day.id, row.id, "cant", paxCount);
        onUpdateEventField(
          day.id,
          row.id,
          "subtotal",
          round2(precio * paxCount),
        );
      });
    });
  }, [paxCount, itinerario, onUpdateEventField]);

  useEffect(() => {
    itinerario.forEach((day) => {
      const unitPrice = round2(
        (day.actividades ?? []).reduce(
          (acc, row) => acc + Number(row?.precio || 0),
          0,
        ),
      );
      if (round2(Number(day.precioUnitario || 0)) === unitPrice) return;
      onUpdateDayField(day.id, "precioUnitario", unitPrice);
    });
  }, [itinerario, onUpdateDayField]);

  useEffect(() => {
    if (!actividades.length) return;

    itinerario.forEach((day) => {
      const selectedProduct = getProductByTitle(day.titulo ?? "");
      const allowedActivities = new Set(
        actividades
          .filter((actividad) =>
            selectedProduct
              ? actividad.idProducto === selectedProduct.id
              : false,
          )
          .map((actividad) => actividad.actividad.trim().toLowerCase()),
      );

      day.actividades.forEach((row) => {
        if (
          !(row.tipo === "ACT1" || row.tipo === "ACT2" || row.tipo === "ACT3")
        )
          return;

        const currentDetail = String(row.detalle ?? "").trim();
        if (!currentDetail || currentDetail === "-") return;

        if (allowedActivities.has(currentDetail.toLowerCase())) return;

        onUpdateEventField(day.id, row.id, "detalle", "-");
        onUpdateEventField(day.id, row.id, "precio", 0);
        onUpdateEventField(day.id, row.id, "cant", 0);
        onUpdateEventField(day.id, row.id, "subtotal", 0);
      });
    });
  }, [itinerario, productos, actividades, onUpdateEventField]);

  const getRowFallback = (
    rowType: ItineraryActivityRow["tipo"],
    idSeed: number,
  ): ItineraryActivityRow => ({
    id: idSeed,
    tipo: rowType,
    detalle: rowType === "ENTRADA" ? "N/A" : "-",
    precio: 0,
    cant: 0,
    subtotal: 0,
  });

  return (
    <SectionCard
      icon={Route}
      title="5. Itinerario Por Fecha"
      description="Actividades y detalles por día."
    >
      <div className="space-y-6">
        {itinerario.map((day, dayIndex) => {
          const dateObj = dayjs(day.fecha);
          const selectedProduct = getProductByTitle(day.titulo ?? "");

          const activityOptions = actividades
            .filter((item) =>
              selectedProduct ? item.idProducto === selectedProduct.id : false,
            )
            .map((item) => item.actividad);

          const normalizedRows = ROW_TYPES.map((rowType, index) => {
            const byType = day.actividades.find((row) => row.tipo === rowType);
            if (byType) return byType;

            const legacyRow = day.actividades[index];
            if (legacyRow) {
              return {
                ...legacyRow,
                tipo: rowType,
                detalle:
                  typeof legacyRow.detalle === "string"
                    ? legacyRow.detalle
                    : rowType === "ENTRADA"
                      ? "N/A"
                      : "-",
                precio: Number(legacyRow.precio || 0),
                cant: Number(legacyRow.cant || 0),
                subtotal: Number(legacyRow.subtotal || 0),
              };
            }

            return getRowFallback(rowType, -1 * (dayIndex + 1) * 10 - index);
          });

          const selectedActivityDetails = normalizedRows
            .filter(
              (row) =>
                (row.tipo === "ACT1" ||
                  row.tipo === "ACT2" ||
                  row.tipo === "ACT3") &&
                row.detalle !== "-" &&
                row.detalle !== "",
            )
            .map((row) => row.detalle);
          const dayUnitPrice = round2(
            normalizedRows.reduce((acc, row) => acc + Number(row.precio || 0), 0),
          );
          const dayRowsTotal = round2(
            normalizedRows.reduce((acc, row) => acc + Number(row.subtotal || 0), 0),
          );
          const dayTotal = dayRowsTotal;

          return (
            <div
              key={day.id}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-sm"
            >
              <div className="grid grid-cols-1 xl:grid-cols-[88px_1fr_220px_220px] gap-4 mb-4">
                <div className="flex items-center justify-center xl:justify-start">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-emerald-100 to-emerald-50 border border-emerald-200 p-2 min-w-[80px] shadow-sm">
                    <span className="text-2xl font-bold text-emerald-700 leading-none">
                      {dateObj.isValid() ? dateObj.format("DD") : dayIndex + 1}
                    </span>
                    <span className="text-xs font-medium text-emerald-800 uppercase tracking-wide">
                      {dateObj.isValid() ? dateObj.format("MMM") : "DIA"}
                    </span>
                  </div>
                </div>

                <Autocomplete
                  freeSolo={false}
                  options={productNames}
                  value={day.titulo}
                  onChange={(_, newValue) => {
                    onUpdateDayField(day.id, "titulo", newValue || "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Producto / Actividad Principal"
                      placeholder="Ej: City Tour Arequipa"
                      size="small"
                      fullWidth
                      variant="outlined"
                      sx={{
                        backgroundColor: "white",
                        "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                      }}
                    />
                  )}
                />

                <TextField
                  label="Precio unitario"
                  value={dayUnitPrice === 0 ? "" : dayUnitPrice.toFixed(2)}
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    backgroundColor: "white",
                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                  }}
                />

                <TextField
                  label="Precio total"
                  value={dayTotal === 0 ? "" : dayTotal.toFixed(2)}
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    backgroundColor: "white",
                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                  }}
                />
              </div>

              <div className="border border-slate-300 rounded-xl text-sm overflow-x-auto bg-white shadow-sm">
                <div className="grid grid-cols-[160px_1fr_120px_120px_120px] border-b border-slate-300 font-bold bg-slate-100 text-slate-800">
                  <div />
                  <div className="border-l border-slate-300 p-2.5">Detalle</div>
                  <div className="border-l border-slate-300 p-2.5 text-center">
                    Precio
                  </div>
                  <div className="border-l border-slate-300 p-2.5 text-center">
                    Cant
                  </div>
                  <div className="border-l border-slate-300 p-2.5 text-center">
                    SubTotal
                  </div>
                </div>

                {normalizedRows.map((row, rowIndex) => {
                  const canPersist = row.id > 0;
                  const detalle = String(row.detalle ?? "").trim();
                  const isRowActive =
                    row.tipo === "ENTRADA"
                      ? detalle !== ""
                      : detalle !== "" && detalle !== "-";

                  const updateRow = (
                    field: keyof Omit<ItineraryActivityRow, "id">,
                    value: string | number,
                  ) => {
                    if (!canPersist) return;
                    onUpdateEventField(day.id, row.id, field, value);
                  };

                  const handlePrecioChange = (precioRaw: string) => {
                    const precio = round2(Number(precioRaw || 0));
                    const cant = Number(row.cant || 0);
                    updateRow("precio", precio);
                    updateRow("subtotal", round2(precio * cant));
                  };

                  const handleCantChange = (cantRaw: string) => {
                    let cant = Math.max(0, Math.floor(Number(cantRaw || 0)));
                    if (paxCount > 0) cant = Math.min(cant, paxCount);
                    const precio = Number(row.precio || 0);
                    updateRow("cant", cant);
                    updateRow("subtotal", round2(precio * cant));
                  };

                  const handleDetalleChange = (nextDetalle: string) => {
                    updateRow("detalle", nextDetalle);

                    if (nextDetalle === "-" || nextDetalle === "") {
                      updateRow("precio", 0);
                      updateRow("cant", 0);
                      updateRow("subtotal", 0);
                      return;
                    }

                    if (
                      row.tipo === "ACT1" ||
                      row.tipo === "ACT2" ||
                      row.tipo === "ACT3"
                    ) {
                      const actividadSeleccionada = actividades.find(
                        (item) =>
                          item.actividad.toLowerCase() ===
                            nextDetalle.toLowerCase() &&
                          (selectedProduct
                            ? item.idProducto === selectedProduct.id
                            : true),
                      );

                      const precioActividad = actividadSeleccionada
                        ? Number(
                            preciosActividades.find(
                              (price) =>
                                String(price.idActi) ===
                                String(actividadSeleccionada.id),
                            )?.precioSol || 0,
                          )
                        : 0;

                      updateRow("precio", round2(precioActividad));
                      updateRow("cant", paxCount);
                      updateRow("subtotal", round2(precioActividad * paxCount));
                      return;
                    }

                    if (row.tipo === "TRASLADO") {
                      const trasladoSeleccionado = traslados.find(
                        (item) =>
                          item.nombre.toLowerCase() ===
                          nextDetalle.toLowerCase(),
                      );

                      const precioTrasladoItem = trasladoSeleccionado
                        ? Number(
                            preciosTraslado.find(
                              (price) =>
                                String(price.id) ===
                                String(trasladoSeleccionado.id),
                            )?.precioSol || 0,
                          )
                        : 0;

                      updateRow("precio", round2(precioTrasladoItem));
                      updateRow("cant", paxCount);
                      updateRow(
                        "subtotal",
                        round2(precioTrasladoItem * paxCount),
                      );
                      return;
                    }

                    if (
                      row.tipo === "ENTRADA" &&
                      paxCount > 0 &&
                      Number(row.cant || 0) === 0
                    ) {
                      updateRow("cant", paxCount);
                      updateRow(
                        "subtotal",
                        round2(Number(row.precio || 0) * paxCount),
                      );
                    }
                  };

                  return (
                    <div
                      key={`${day.id}-${row.tipo}`}
                      className={`grid grid-cols-[160px_1fr_120px_120px_120px] border-b border-slate-200 last:border-b-0 ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center px-2 py-1.5">
                        <span className="inline-flex items-center rounded-md bg-orange-500 text-white text-xs px-2.5 py-1 font-semibold tracking-wide">
                          {ROW_LABELS[row.tipo]}
                        </span>
                      </div>

                      <div className="border-l border-slate-200 p-1.5">
                        {(row.tipo === "ACT1" ||
                          row.tipo === "ACT2" ||
                          row.tipo === "ACT3") && (
                          <select
                            className="w-full h-9 border border-slate-300 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            value={row.detalle}
                            onChange={(e) =>
                              handleDetalleChange(e.target.value)
                            }
                          >
                            <option value="-">-</option>
                            {activityOptions
                              .filter(
                                (option) =>
                                  !selectedActivityDetails.includes(option) ||
                                  row.detalle === option,
                              )
                              .map((option) => (
                                <option
                                  key={`${row.tipo}-${option}`}
                                  value={option}
                                >
                                  {option}
                                </option>
                              ))}
                          </select>
                        )}

                        {row.tipo === "TRASLADO" && (
                          <select
                            className="w-full h-9 border border-slate-300 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            value={row.detalle}
                            onChange={(e) =>
                              handleDetalleChange(e.target.value)
                            }
                          >
                            <option value="-">-</option>
                            {trasladoNames.map((option) => (
                              <option
                                key={`${row.tipo}-${option}`}
                                value={option}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        )}

                        {row.tipo === "ENTRADA" && (
                          <input
                            className="w-full h-9 border border-slate-300 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            value={row.detalle}
                            onChange={(e) =>
                              handleDetalleChange(e.target.value)
                            }
                          />
                        )}
                      </div>

                      <div className="border-l border-slate-200 p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          className="w-full h-9 border border-slate-300 rounded-md px-2 bg-white text-right focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100"
                          value={row.precio === 0 ? "" : row.precio}
                          onChange={(e) => handlePrecioChange(e.target.value)}
                          disabled={!isRowActive}
                        />
                      </div>

                      <div className="border-l border-slate-200 p-1.5">
                        <input
                          type="number"
                          step="1"
                          min={0}
                          max={paxCount || undefined}
                          className="w-full h-9 border border-slate-300 rounded-md px-2 bg-white text-right focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100"
                          value={row.cant === 0 ? "" : row.cant}
                          onChange={(e) => handleCantChange(e.target.value)}
                          disabled={!isRowActive}
                        />
                      </div>

                      <div className="border-l border-slate-200 p-2.5 text-right font-semibold text-slate-800 bg-white">
                        {row.subtotal ? `S/ ${row.subtotal.toFixed(2)}` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3">
                <TextControlled<ItinerarySectionFormValues>
                  name={getObservationFieldName(day.id)}
                  control={control}
                  label="Observaciones del día"
                  placeholder="Escribe notas adicionales para este día"
                  multiline
                  rows={3}
                  size="small"
                  disableAutoUppercase
                  onChange={(e) =>
                    onUpdateDayField(day.id, "observacion", e.target.value)
                  }
                  sx={{
                    backgroundColor: "white",
                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default ItinerarySection;
