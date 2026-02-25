import { Autocomplete, TextField } from "@mui/material";
import { Route } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import {
  serviciosDB,
  type Actividad,
  type PrecioActividad,
  type PrecioProducto,
  type PrecioTraslado,
  type Producto,
  type Traslado,
} from "@/app/db/serviciosDB";
import { TextControlled } from "@/components/ui/inputs";
import { getTravelCurrencySymbol } from "../constants/travelPackage.constants";
import type {
  ItineraryDayRow,
  ItineraryActivityRow,
  TravelPackageFormState,
} from "../types/travelPackage.types";
import SectionCard from "./SectionCard";

dayjs.locale("es");

type Props = {
  itinerario: ItineraryDayRow[];
  cantPax: string;
  moneda: TravelPackageFormState["moneda"];
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
const NO_ACTIVITY_OPTION = "SIN ACTIVIDAD";
const BALLESTAS_LABEL = "EXCURSION ISLAS BALLESTAS";
const BALLESTAS_ENTRADA_DETAIL = "IMPTOS DE ISLAS + MUELLE";
const BALLESTAS_ENTRADA_PRICE = 16;

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
const normalizeText = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
const isBallestasText = (value: string) =>
  normalizeText(value) === BALLESTAS_LABEL;
const ENTRADA_PRODUCT_ID = 4;
const preventNumberArrowStep = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
  }
};

const ItinerarySection = ({
  itinerario,
  cantPax,
  moneda,
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
  const [preciosProducto, setPreciosProducto] = useState<PrecioProducto[]>([]);
  const [preciosActividades, setPreciosActividades] = useState<
    PrecioActividad[]
  >([]);
  const [preciosTraslado, setPreciosTraslado] = useState<PrecioTraslado[]>([]);
  const isSyncingRowsRef = useRef(false);
  const { control, setValue } = useForm<ItinerarySectionFormValues>({
    defaultValues: {},
  });

  const paxCount = Math.max(0, Number(cantPax || 0));
  const currencySymbol = getTravelCurrencySymbol(moneda);

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      const [
        productosRows,
        actividadesRows,
        trasladosRows,
        preciosProductoRows,
        preciosActividadesRows,
        preciosTrasladoRows,
      ] = await Promise.all([
        serviciosDB.productos.toArray(),
        serviciosDB.actividades.toArray(),
        serviciosDB.traslados.toArray(),
        serviciosDB.preciosProducto.toArray(),
        serviciosDB.preciosActividades.toArray(),
        serviciosDB.preciosTraslado.toArray(),
      ]);

      if (!active) return;

      setProductos(productosRows);
      setActividades(actividadesRows);
      setTraslados(trasladosRows);
      setPreciosProducto(preciosProductoRows);
      setPreciosActividades(preciosActividadesRows);
      setPreciosTraslado(preciosTrasladoRows);
    };

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  const productNames = useMemo(
    () =>
      Array.from(
        new Set([
          NO_ACTIVITY_OPTION,
          ...productos.map((producto) => String(producto.nombre ?? "").trim()),
        ]),
      ).filter(Boolean),
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
  const getProductBasePrice = (productId?: number) => {
    if (!productId) return 0;
    const priceRow = preciosProducto.find(
      (price) => Number(price.idProducto) === Number(productId),
    );
    return round2(Number(priceRow?.precioVenta ?? priceRow?.precioBase ?? 0));
  };

  const getObservationFieldName = (dayId: number) => `observacion_${dayId}`;

  useEffect(() => {
    itinerario.forEach((day) => {
      setValue(getObservationFieldName(day.id), day.observacion ?? "");
    });
  }, [itinerario, setValue]);

  useEffect(() => {
    if (isSyncingRowsRef.current) return;
    let changed = false;

    itinerario.forEach((day) => {
      const selectedProduct = getProductByTitle(day.titulo ?? "");
      const shouldShowEntrada =
        Number(selectedProduct?.id) === ENTRADA_PRODUCT_ID;
      if (!shouldShowEntrada) {
        const entradaRowToClear = (day.actividades ?? []).find(
          (row) => row.tipo === "ENTRADA" && row.id > 0,
        );
        if (entradaRowToClear) {
          if (String(entradaRowToClear.detalle ?? "") !== "N/A") {
            changed = true;
            onUpdateEventField(day.id, entradaRowToClear.id, "detalle", "N/A");
          }
          if (Number(entradaRowToClear.precio || 0) !== 0) {
            changed = true;
            onUpdateEventField(day.id, entradaRowToClear.id, "precio", 0);
          }
          if (Number(entradaRowToClear.cant || 0) !== 0) {
            changed = true;
            onUpdateEventField(day.id, entradaRowToClear.id, "cant", 0);
          }
          if (Number(entradaRowToClear.subtotal || 0) !== 0) {
            changed = true;
            onUpdateEventField(day.id, entradaRowToClear.id, "subtotal", 0);
          }
        }
      }
    });

    if (changed) {
      isSyncingRowsRef.current = true;
      queueMicrotask(() => {
        isSyncingRowsRef.current = false;
      });
    }
  }, [itinerario, onUpdateEventField]);

  useEffect(() => {
    if (isSyncingRowsRef.current) return;
    if (!actividades.length) return;
    let changed = false;

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

        changed = true;
        onUpdateEventField(day.id, row.id, "detalle", "-");
        onUpdateEventField(day.id, row.id, "precio", 0);
        onUpdateEventField(day.id, row.id, "cant", 0);
        onUpdateEventField(day.id, row.id, "subtotal", 0);
      });
    });

    if (changed) {
      isSyncingRowsRef.current = true;
      queueMicrotask(() => {
        isSyncingRowsRef.current = false;
      });
    }
  }, [itinerario, productos, actividades, onUpdateEventField]);

  useEffect(() => {
    if (isSyncingRowsRef.current) return;
    let changed = false;

    itinerario.forEach((day) => {
      const selectedProduct = getProductByTitle(day.titulo ?? "");
      const shouldShowEntrada =
        Number(selectedProduct?.id) === ENTRADA_PRODUCT_ID;
      if (!shouldShowEntrada) return;

      const actividadBallestas = (day.actividades ?? []).find(
        (row) =>
          (row.tipo === "ACT1" || row.tipo === "ACT2" || row.tipo === "ACT3") &&
          isBallestasText(String(row.detalle ?? "")),
      );
      const entradaRow = (day.actividades ?? []).find(
        (row) => row.tipo === "ENTRADA" && row.id > 0,
      );
      if (!entradaRow) return;

      if (actividadBallestas) {
        const cantBallestasRaw = Number(actividadBallestas.cant || 0);
        const cantBallestas =
          cantBallestasRaw > 0
            ? Math.min(cantBallestasRaw, paxCount)
            : Math.max(paxCount, 0);
        const subtotal = round2(BALLESTAS_ENTRADA_PRICE * cantBallestas);

        if (String(entradaRow.detalle ?? "") !== BALLESTAS_ENTRADA_DETAIL) {
          changed = true;
          onUpdateEventField(
            day.id,
            entradaRow.id,
            "detalle",
            BALLESTAS_ENTRADA_DETAIL,
          );
        }
        if (Number(entradaRow.precio || 0) !== BALLESTAS_ENTRADA_PRICE) {
          changed = true;
          onUpdateEventField(
            day.id,
            entradaRow.id,
            "precio",
            BALLESTAS_ENTRADA_PRICE,
          );
        }
        if (Number(entradaRow.cant || 0) !== cantBallestas) {
          changed = true;
          onUpdateEventField(day.id, entradaRow.id, "cant", cantBallestas);
        }
        if (round2(Number(entradaRow.subtotal || 0)) !== subtotal) {
          changed = true;
          onUpdateEventField(day.id, entradaRow.id, "subtotal", subtotal);
        }
        return;
      }

      if (String(entradaRow.detalle ?? "") !== "N/A") {
        changed = true;
        onUpdateEventField(day.id, entradaRow.id, "detalle", "N/A");
      }
      if (Number(entradaRow.precio || 0) !== 0) {
        changed = true;
        onUpdateEventField(day.id, entradaRow.id, "precio", 0);
      }
      if (Number(entradaRow.cant || 0) !== 0) {
        changed = true;
        onUpdateEventField(day.id, entradaRow.id, "cant", 0);
      }
      if (Number(entradaRow.subtotal || 0) !== 0) {
        changed = true;
        onUpdateEventField(day.id, entradaRow.id, "subtotal", 0);
      }
    });

    if (changed) {
      isSyncingRowsRef.current = true;
      queueMicrotask(() => {
        isSyncingRowsRef.current = false;
      });
    }
  }, [itinerario, paxCount, onUpdateEventField]);

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
      title="5. Descripcion del paquete"
      description="Actividades y detalles por día."
    >
      <div className="space-y-6">
        {itinerario.map((day, dayIndex) => {
          const dateObj = dayjs(day.fecha);
          const selectedProduct = getProductByTitle(day.titulo ?? "");
          const shouldShowEntrada =
            Number(selectedProduct?.id) === ENTRADA_PRODUCT_ID;
          const isNoActivitySelected =
            String(day.titulo ?? "")
              .trim()
              .toUpperCase() === NO_ACTIVITY_OPTION;
          const selectedProductsInOtherDays = new Set(
            itinerario
              .filter((itDay) => itDay.id !== day.id)
              .map((itDay) => String(itDay.titulo ?? "").trim())
              .filter(
                (title) =>
                  title !== "" &&
                  normalizeText(title) !== normalizeText(NO_ACTIVITY_OPTION),
              )
              .map((title) => normalizeText(title)),
          );
          const availableProductNames = productNames.filter((name) => {
            const normalizedName = normalizeText(name);
            if (normalizedName === normalizeText(NO_ACTIVITY_OPTION))
              return true;
            if (normalizeText(String(day.titulo ?? "")) === normalizedName)
              return true;
            return !selectedProductsInOtherDays.has(normalizedName);
          });

          const activityOptions = actividades
            .filter((item) =>
              selectedProduct ? item.idProducto === selectedProduct.id : false,
            )
            .map((item) => item.actividad);

          const rowTypesToRender = shouldShowEntrada
            ? ROW_TYPES
            : ROW_TYPES.filter((rowType) => rowType !== "ENTRADA");
          const normalizedRows = rowTypesToRender.map((rowType, index) => {
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
          const dayUnitPrice = round2(Number(day.precioUnitario || 0));
          const dayRowsTotal = round2(
            normalizedRows.reduce(
              (acc, row) => acc + Number(row.subtotal || 0),
              0,
            ),
          );
          const dayTotal = round2(dayUnitPrice * paxCount + dayRowsTotal);

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
                  options={availableProductNames}
                  value={day.titulo}
                  onChange={(_, newValue) => {
                    const nextTitle = newValue || "";
                    if (nextTitle !== String(day.titulo ?? "")) {
                      onUpdateDayField(day.id, "titulo", nextTitle);
                    }
                    const nextSelectedProduct = getProductByTitle(nextTitle);
                    const nextBasePrice = getProductBasePrice(
                      nextSelectedProduct?.id,
                    );
                    if (
                      round2(Number(day.precioUnitario || 0)) !== nextBasePrice
                    ) {
                      onUpdateDayField(day.id, "precioUnitario", nextBasePrice);
                    }

                    if (nextTitle === NO_ACTIVITY_OPTION) {
                      normalizedRows.forEach((row) => {
                        if (row.id <= 0) return;
                        if (String(row.detalle ?? "") !== "-") {
                          onUpdateEventField(day.id, row.id, "detalle", "-");
                        }
                        if (Number(row.precio || 0) !== 0) {
                          onUpdateEventField(day.id, row.id, "precio", 0);
                        }
                        if (Number(row.cant || 0) !== 0) {
                          onUpdateEventField(day.id, row.id, "cant", 0);
                        }
                        if (Number(row.subtotal || 0) !== 0) {
                          onUpdateEventField(day.id, row.id, "subtotal", 0);
                        }
                      });
                    }
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
                  value={
                    Number(day.precioUnitario || 0) === 0
                      ? ""
                      : String(day.precioUnitario)
                  }
                  type="number"
                  size="small"
                  inputProps={{
                    min: 0,
                    step: "any",
                    onKeyDown: preventNumberArrowStep,
                  }}
                  onChange={(e) => {
                    const raw = String(e.target.value ?? "").trim();
                    if (raw === "") {
                      onUpdateDayField(day.id, "precioUnitario", 0);
                      return;
                    }
                    const parsedValue = Number(raw);
                    if (Number.isNaN(parsedValue)) return;
                    const nextValue = parsedValue < 0 ? 0 : parsedValue;
                    onUpdateDayField(day.id, "precioUnitario", nextValue);
                  }}
                  sx={{
                    backgroundColor: "white",
                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                  }}
                />

                <TextField
                  label="Importe Total"
                  value={
                    dayTotal === 0
                      ? ""
                      : `${currencySymbol} ${dayTotal.toFixed(2)}`
                  }
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    backgroundColor: "white",
                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                  }}
                />
              </div>

              {!isNoActivitySelected && (
                <div className="border border-slate-300 rounded-xl text-sm overflow-x-auto bg-white shadow-sm">
                  <div className="grid grid-cols-[160px_1fr_120px_120px_120px] border-b border-slate-300 font-bold bg-slate-100 text-slate-800">
                    <div />
                    <div className="border-l border-slate-300 p-2.5">
                      Detalle
                    </div>
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
                    const isBallestasRowSelected =
                      (row.tipo === "ACT1" ||
                        row.tipo === "ACT2" ||
                        row.tipo === "ACT3") &&
                      isBallestasText(detalle);
                    const isBallestasSelectedInDay = normalizedRows.some(
                      (activityRow) =>
                        (activityRow.tipo === "ACT1" ||
                          activityRow.tipo === "ACT2" ||
                          activityRow.tipo === "ACT3") &&
                        isBallestasText(String(activityRow.detalle ?? "")),
                    );
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
                          ? isBallestasText(nextDetalle)
                            ? 0
                            : Number(
                                preciosActividades.find(
                                  (price) =>
                                    String(price.idActi) ===
                                    String(actividadSeleccionada.id),
                                )?.precioSol || 0,
                              )
                          : 0;

                        updateRow("precio", round2(precioActividad));
                        updateRow("cant", paxCount);
                        updateRow(
                          "subtotal",
                          round2(precioActividad * paxCount),
                        );
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
                              disabled={isBallestasSelectedInDay}
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
                            onKeyDown={preventNumberArrowStep}
                            disabled={
                              !isRowActive ||
                              row.tipo === "ENTRADA" ||
                              isBallestasRowSelected
                            }
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
                            onKeyDown={preventNumberArrowStep}
                            disabled={
                              !isRowActive ||
                              row.tipo === "ENTRADA" ||
                              isBallestasSelectedInDay
                            }
                          />
                        </div>

                        <div className="border-l border-slate-200 p-2.5 text-right font-semibold text-slate-800 bg-white">
                          {row.subtotal
                            ? `${currencySymbol} ${row.subtotal.toFixed(2)}`
                            : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3">
                <TextControlled<ItinerarySectionFormValues>
                  name={getObservationFieldName(day.id)}
                  control={control}
                  label="Observaciones del día"
                  placeholder="Escribe notas adicionales para este día"
                  multiline
                  rows={3}
                  size="small"
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
