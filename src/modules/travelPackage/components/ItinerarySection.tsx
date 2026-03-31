import { Autocomplete, TextField } from "@mui/material";
import { Route } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useForm } from "react-hook-form";
import { refreshServiciosData } from "@/app/db/serviciosSync";
import {
  serviciosDB,
  type Actividad,
  type PrecioActividad,
  type PrecioProducto,
  type PrecioTraslado,
  type Producto,
  type ProductoResto,
  type Traslado,
} from "@/app/db/serviciosDB";
import { showToast } from "@/components/ui/AppToast";
import { TextControlled } from "@/components/ui/inputs";
import { getTravelCurrencySymbol } from "../constants/travelPackage.constants";
import type {
  ItineraryDayRow,
  ItineraryActivityRow,
  PassengerRow,
  TravelPackageFormState,
} from "../types/travelPackage.types";
import SectionCard from "./SectionCard";

dayjs.locale("es");

type Props = {
  itinerario: ItineraryDayRow[];
  destinos: string[];
  cantPax: string;
  pasajeros: PassengerRow[];
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

const NO_ACTIVITY_OPTION = "SIN ACTIVIDAD";
const BALLESTAS_LABEL = "EXCURSION ISLAS BALLESTAS";
const BALLESTAS_ENTRADA_DETAIL = "IMPTOS DE ISLAS + MUELLE";
const BALLESTAS_ENTRADA_PRICE = 16;

const ROW_LABELS: Record<
  Exclude<ItineraryActivityRow["tipo"], "ACT1" | "ACT2" | "ACT3">,
  string
> = {
  TRASLADO: "Traslados",
  ENTRADA: "Entradas",
};

type ItinerarySectionFormValues = Record<string, string>;
type ItineraryProducto = Producto & {
  precioVenta?: number;
  precioDol?: number;
};

const round2 = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const pickFirstPositive = (...values: unknown[]) => {
  const nums = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const positive = nums.find((value) => value > 0);
  return positive ?? nums[0] ?? 0;
};
const normalizeText = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
const isBallestasText = (value: string) =>
  normalizeText(value) === BALLESTAS_LABEL;
const isActivityType = (tipo: ItineraryActivityRow["tipo"]) =>
  tipo === "ACT1" || tipo === "ACT2" || tipo === "ACT3";
const ENTRADA_PRODUCT_ID = 4;
const preventNumberArrowStep = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
  }
};

const ItinerarySection = ({
  itinerario,
  destinos,
  cantPax,
  pasajeros,
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

  const [productos, setProductos] = useState<ItineraryProducto[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [traslados, setTraslados] = useState<Traslado[]>([]);
  const [preciosProducto, setPreciosProducto] = useState<PrecioProducto[]>([]);
  const [preciosActividades, setPreciosActividades] = useState<
    PrecioActividad[]
  >([]);
  const [preciosTraslado, setPreciosTraslado] = useState<PrecioTraslado[]>([]);
  const isSyncingRowsRef = useRef(false);
  const syncedProductTitleByDayRef = useRef<Record<number, string>>({});
  const { control, setValue } = useForm<ItinerarySectionFormValues>({
    defaultValues: {},
  });

  const totalPaxCount = Math.max(0, Number(cantPax || 0));
  const paxCount = useMemo(() => {
    const passengerRows = pasajeros ?? [];
    if (!passengerRows.length) return totalPaxCount;

    return Math.max(
      0,
      passengerRows.filter(
        (passenger) =>
          String(passenger.tipoPasajero ?? "")
            .trim()
            .toUpperCase() !== "LIBERADO",
      ).length,
    );
  }, [pasajeros, totalPaxCount]);
  const currencySymbol = getTravelCurrencySymbol(moneda);
  const isDolCurrency = String(moneda ?? "").toUpperCase() === "DOLARES";

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      const [
        productosRowsInitial,
        productosCityTourRowsInitial,
        productosRestoRowsInitial,
        actividadesRows,
        trasladosRows,
        preciosProductoRows,
        preciosActividadesRows,
        preciosTrasladoRows,
      ] = await Promise.all([
        serviciosDB.productos.toArray(),
        serviciosDB.productosCityTourOrdena.toArray(),
        serviciosDB.productosResto.toArray(),
        serviciosDB.actividades.toArray(),
        serviciosDB.traslados.toArray(),
        serviciosDB.preciosProducto.toArray(),
        serviciosDB.preciosActividades.toArray(),
        serviciosDB.preciosTraslado.toArray(),
      ]);
      let productosRows = productosRowsInitial;
      let productosCityTourRows = productosCityTourRowsInitial;
      let productosRestoRows = productosRestoRowsInitial;

      // Si aún faltan bloques de productos en local, sincronizamos y reintentamos.
      if (!productosCityTourRows.length || !productosRestoRows.length) {
        try {
          await refreshServiciosData();
          [productosRows, productosCityTourRows, productosRestoRows] =
            await Promise.all([
              serviciosDB.productos.toArray(),
              serviciosDB.productosCityTourOrdena.toArray(),
              serviciosDB.productosResto.toArray(),
            ]);
        } catch (error) {
          console.error(
            "No se pudo refrescar servicios para cargar productos del itinerario",
            error,
          );
        }
      }

      const mergedProductos: ItineraryProducto[] = [
        ...productosRows.map((item) => ({
          ...item,
          precioVenta: undefined,
          precioDol: undefined,
        })),
        ...productosCityTourRows.map((item) => ({
          id: item.id,
          nombre: item.nombre,
          region: item.region,
          precioVenta: undefined,
          precioDol: undefined,
        })),
        ...productosRestoRows.map((item: ProductoResto) => ({
          id: item.id,
          nombre: item.nombre,
          region: item.region,
          precioVenta: Number(item.precioVenta || 0),
          precioDol: Number(item.precioDol || 0),
        })),
      ];
      const uniqueByName = new Map<string, ItineraryProducto>();
      mergedProductos.forEach((item) => {
        const key = normalizeText(String(item.nombre ?? ""));
        if (!key) return;

        const existing = uniqueByName.get(key);
        if (!existing) {
          uniqueByName.set(key, item);
          return;
        }

        const merged: ItineraryProducto = {
          ...existing,
          region: existing.region || item.region,
          precioVenta:
            existing.precioVenta !== undefined
              ? existing.precioVenta
              : item.precioVenta,
          precioDol:
            existing.precioDol !== undefined
              ? existing.precioDol
              : item.precioDol,
        };
        uniqueByName.set(key, merged);
      });

      if (!active) return;

      setProductos(Array.from(uniqueByName.values()));
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

  const selectedRegionKeys = useMemo(
    () =>
      new Set(
        (destinos ?? [])
          .map((region) => normalizeText(String(region ?? "")))
          .filter(Boolean),
      ),
    [destinos],
  );

  const productosFiltradosPorRegion = useMemo(() => {
    if (!selectedRegionKeys.size) return productos;

    return productos.filter((producto) => {
      const regionKey = normalizeText(String(producto.region ?? ""));
      return regionKey !== "" && selectedRegionKeys.has(regionKey);
    });
  }, [productos, selectedRegionKeys]);

  const productNames = useMemo(
    () =>
      Array.from(
        new Set([
          NO_ACTIVITY_OPTION,
          ...productosFiltradosPorRegion.map((producto) =>
            String(producto.nombre ?? "").trim(),
          ),
        ]),
      ).filter(Boolean),
    [productosFiltradosPorRegion],
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
  const getCatalogActivityNamesByProduct = (productId?: number) =>
    actividades
      .filter((item) =>
        productId ? Number(item.idProducto) === Number(productId) : false,
      )
      .map((item) => String(item.actividad ?? "").trim())
      .filter(Boolean);
  const getProductActivityNames = (pool: ItineraryProducto[]) =>
    Array.from(
      new Set(
        pool
          .map((producto) => String(producto.nombre ?? "").trim())
          .filter(Boolean),
      ),
    );
  const resolveActivityMode = (
    productId?: number,
    pool: ItineraryProducto[] = productos,
  ) => {
    const catalogActivityNames = getCatalogActivityNamesByProduct(productId);
    if (catalogActivityNames.length > 0) {
      return {
        useProductActivities: false,
        options: catalogActivityNames,
      };
    }
    return {
      useProductActivities: Boolean(productId),
      options: getProductActivityNames(pool),
    };
  };
  const getProductBasePrice = (productId?: number) => {
    if (!productId) return 0;
    const productData = productos.find(
      (producto) => Number(producto.id) === Number(productId),
    );
    if (
      productData &&
      (productData.precioVenta !== undefined ||
        productData.precioDol !== undefined)
    ) {
      const embeddedPrice = isDolCurrency
        ? pickFirstPositive(productData.precioDol, productData.precioVenta)
        : pickFirstPositive(productData.precioVenta, productData.precioDol);
      return round2(embeddedPrice);
    }

    const priceRow = preciosProducto.find(
      (price) => Number(price.idProducto) === Number(productId),
    );
    const price = isDolCurrency
      ? pickFirstPositive(
          priceRow?.precioDol,
          priceRow?.precioVenta,
          priceRow?.precioBase,
        )
      : pickFirstPositive(
          priceRow?.precioVenta,
          priceRow?.precioBase,
          priceRow?.precioDol,
        );
    return round2(price);
  };
  const getProductVisits = (productId?: number) => {
    if (!productId) return "";
    const priceRow = preciosProducto.find(
      (price) => Number(price.idProducto) === Number(productId),
    );
    return String(priceRow?.visitas ?? "").trim();
  };
  const getActivityUnitPrice = (activityId?: number) => {
    if (!activityId) return 0;
    const priceRow = preciosActividades.find(
      (price) => Number(price.idActi) === Number(activityId),
    );
    const price = isDolCurrency
      ? pickFirstPositive(priceRow?.precioDol, priceRow?.precioSol)
      : pickFirstPositive(priceRow?.precioSol, priceRow?.precioDol);
    return round2(price);
  };
  const getTrasladoUnitPrice = (trasladoId?: number) => {
    if (!trasladoId) return 0;
    const priceRow = preciosTraslado.find(
      (price) => Number(price.id) === Number(trasladoId),
    );
    const price = isDolCurrency
      ? pickFirstPositive(priceRow?.precioDol, priceRow?.precioSol)
      : pickFirstPositive(priceRow?.precioSol, priceRow?.precioDol);
    return round2(price);
  };

  const getObservationFieldName = (dayId: number) => `observacion_${dayId}`;
  const getViajeExcursionesFieldName = (dayId: number) =>
    `viaje_excursiones_${dayId}`;
  const setDayViajeExcursiones = (
    dayId: number,
    currentValue: string,
    nextValue: string,
  ) => {
    if (String(currentValue ?? "") === nextValue) return;
    onUpdateDayField(dayId, "viajeExcursiones", nextValue);
  };
  const focusObservationField = (dayId: number) => {
    setTimeout(() => {
      const observationField = document.querySelector<HTMLElement>(
        `textarea[data-observation-day="${dayId}"], input[data-observation-day="${dayId}"]`,
      );
      observationField?.focus();
    }, 0);
  };
  const focusUnitPriceField = (dayId: number) => {
    setTimeout(() => {
      const unitPriceField = document.querySelector<HTMLInputElement>(
        `input[data-unit-price-day="${dayId}"]`,
      );
      unitPriceField?.focus();
      unitPriceField?.select();
    }, 0);
  };

  useEffect(() => {
    itinerario.forEach((day) => {
      setValue(getObservationFieldName(day.id), day.observacion ?? "");
      setValue(
        getViajeExcursionesFieldName(day.id),
        day.viajeExcursiones ?? "",
      );
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
      const { options } = resolveActivityMode(selectedProduct?.id, productos);
      const allowedActivities = new Set(
        options.map((option) =>
          String(option ?? "")
            .trim()
            .toLowerCase(),
        ),
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

  useEffect(() => {
    if (isSyncingRowsRef.current) return;
    if (!itinerario.length) return;
    let changed = false;
    const seenDayIds = new Set<number>();
    const nextSyncedProductTitleByDay = {
      ...syncedProductTitleByDayRef.current,
    };

    itinerario.forEach((day) => {
      const dayId = Number(day.id);
      seenDayIds.add(dayId);
      const currentTitleKey = normalizeText(String(day.titulo ?? ""));
      const previousTitleKey = syncedProductTitleByDayRef.current[dayId];
      nextSyncedProductTitleByDay[dayId] = currentTitleKey;

      // Evita pisar precios de datos ya cargados en el primer render.
      if (previousTitleKey === undefined) return;
      if (previousTitleKey === currentTitleKey) return;

      const selectedProduct = getProductByTitle(day.titulo ?? "");
      const nextBasePrice = getProductBasePrice(selectedProduct?.id);
      if (round2(Number(day.precioUnitario || 0)) !== nextBasePrice) {
        changed = true;
        onUpdateDayField(day.id, "precioUnitario", nextBasePrice);
      }

      (day.actividades ?? []).forEach((row) => {
        if (row.id <= 0) return;

        if (row.tipo === "ACT1" || row.tipo === "ACT2" || row.tipo === "ACT3") {
          const detalle = String(row.detalle ?? "").trim();
          if (!detalle || detalle === "-") return;

          const { useProductActivities } = resolveActivityMode(
            selectedProduct?.id,
            productos,
          );
          const actividadSeleccionada = useProductActivities
            ? null
            : actividades.find(
                (item) =>
                  item.actividad.toLowerCase() === detalle.toLowerCase() &&
                  (selectedProduct
                    ? item.idProducto === selectedProduct.id
                    : true),
              );
          const actividadProductoSeleccionada = useProductActivities
            ? getProductByTitle(detalle)
            : null;
          const nextPrice = isBallestasText(detalle)
            ? 0
            : useProductActivities
              ? getProductBasePrice(actividadProductoSeleccionada?.id)
              : actividadSeleccionada
                ? getActivityUnitPrice(actividadSeleccionada.id)
                : 0;
          const nextSubtotal = round2(nextPrice * Number(row.cant || 0));

          if (round2(Number(row.precio || 0)) !== nextPrice) {
            changed = true;
            onUpdateEventField(day.id, row.id, "precio", nextPrice);
          }
          if (round2(Number(row.subtotal || 0)) !== nextSubtotal) {
            changed = true;
            onUpdateEventField(day.id, row.id, "subtotal", nextSubtotal);
          }
        }
      });
    });

    Object.keys(nextSyncedProductTitleByDay).forEach((key) => {
      const dayId = Number(key);
      if (!seenDayIds.has(dayId)) {
        delete nextSyncedProductTitleByDay[dayId];
      }
    });
    syncedProductTitleByDayRef.current = nextSyncedProductTitleByDay;

    if (changed) {
      isSyncingRowsRef.current = true;
      queueMicrotask(() => {
        isSyncingRowsRef.current = false;
      });
    }
  }, [itinerario, actividades, onUpdateDayField, onUpdateEventField]);

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

          const { useProductActivities, options: activityOptions } =
            resolveActivityMode(
              selectedProduct?.id,
              productosFiltradosPorRegion,
            );

          const renderedRows = (day.actividades ?? [])
            .filter((row) => shouldShowEntrada || row.tipo !== "ENTRADA")
            .map((row) => ({
              ...row,
              detalle:
                typeof row.detalle === "string"
                  ? row.detalle
                  : row.tipo === "ENTRADA"
                    ? "N/A"
                    : "-",
              viajeExcursiones:
                typeof row.viajeExcursiones === "string"
                  ? row.viajeExcursiones
                  : "",
              precio: Number(row.precio || 0),
              cant: Number(row.cant || 0),
              subtotal: Number(row.subtotal || 0),
            }));
          const activityLabelIndexById = new Map(
            renderedRows
              .filter((row) => isActivityType(row.tipo))
              .map((row, index) => [Number(row.id), index + 1]),
          );

          const selectedActivityDetails = renderedRows
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
            renderedRows.reduce(
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
                    const currentTitle = String(day.titulo ?? "");
                    const isChangingSelection = nextTitle !== currentTitle;

                    if (isChangingSelection && totalPaxCount <= 0) {
                      showToast({
                        title: "Alerta",
                        description: "Anade un pasajero por lo menos.",
                        type: "error",
                      });
                      return;
                    }

                    if (nextTitle !== String(day.titulo ?? "")) {
                      onUpdateDayField(day.id, "titulo", nextTitle);
                    }
                    const nextSelectedProduct = getProductByTitle(nextTitle);
                    const nextBasePrice = getProductBasePrice(
                      nextSelectedProduct?.id,
                    );
                    const nextProductVisits = getProductVisits(
                      nextSelectedProduct?.id,
                    );
                    if (
                      round2(Number(day.precioUnitario || 0)) !== nextBasePrice
                    ) {
                      onUpdateDayField(day.id, "precioUnitario", nextBasePrice);
                    }

                    if (nextTitle === NO_ACTIVITY_OPTION) {
                      renderedRows.forEach((row) => {
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
                      setDayViajeExcursiones(
                        day.id,
                        day.viajeExcursiones ?? "",
                        "",
                      );
                      focusObservationField(day.id);
                      return;
                    }
                    setDayViajeExcursiones(
                      day.id,
                      day.viajeExcursiones ?? "",
                      nextProductVisits,
                    );
                    if (nextTitle) focusUnitPriceField(day.id);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Producto / Actividad Principal"
                      placeholder="Ej: City Tour Arequipa"
                      autoComplete="off"
                      size="small"
                      fullWidth
                      variant="outlined"
                      inputProps={{
                        ...params.inputProps,
                        autoComplete: "new-password",
                        name: `nh-itinerary-producto-${String(day.id)}`,
                        autoCorrect: "off",
                        spellCheck: false,
                        autoCapitalize: "none",
                        "aria-autocomplete": "none",
                        "data-lpignore": "true",
                        "data-1p-ignore": "true",
                        "data-bwignore": "true",
                        "data-form-type": "other",
                        "data-autocomplete": "off",
                      }}
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
                    "data-unit-price-day": String(day.id),
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
                  value={dayTotal === 0 ? "" : ` ${dayTotal.toFixed(2)}`}
                  size="small"
                  InputProps={{ readOnly: true }}
                  sx={{
                    backgroundColor: "white",
                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                  }}
                />
              </div>

              {!isNoActivitySelected && (
                <>
                  <div className="mb-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onAddEvent(day.id)}
                      className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Agregar actividad
                    </button>
                  </div>
                  {renderedRows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
                      Sin actividades. Usa "Agregar actividad" para crear una.
                    </div>
                  ) : (
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

                      {renderedRows.map((row, rowIndex) => {
                        const canPersist = row.id > 0;
                        const activityLabelNumber = activityLabelIndexById.get(
                          Number(row.id),
                        );
                        const rowLabel = isActivityType(row.tipo)
                          ? `Actividad ${activityLabelNumber ?? 1}`
                          : ROW_LABELS[row.tipo];
                        const detalle = String(row.detalle ?? "").trim();
                        const isBallestasRowSelected =
                          isActivityType(row.tipo) && isBallestasText(detalle);
                        const isBallestasSelectedInDay = renderedRows.some(
                          (activityRow) =>
                            isActivityType(activityRow.tipo) &&
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
                          let cant = Math.max(
                            0,
                            Math.floor(Number(cantRaw || 0)),
                          );
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

                          if (isActivityType(row.tipo)) {
                            const actividadSeleccionada = useProductActivities
                              ? null
                              : actividades.find(
                                  (item) =>
                                    item.actividad.toLowerCase() ===
                                      nextDetalle.toLowerCase() &&
                                    (selectedProduct
                                      ? item.idProducto === selectedProduct.id
                                      : true),
                                );
                            const actividadProductoSeleccionada =
                              useProductActivities
                                ? getProductByTitle(nextDetalle)
                                : null;
                            const precioActividad = isBallestasText(nextDetalle)
                              ? 0
                              : useProductActivities
                                ? getProductBasePrice(
                                    actividadProductoSeleccionada?.id,
                                  )
                                : actividadSeleccionada
                                  ? getActivityUnitPrice(
                                      actividadSeleccionada.id,
                                    )
                                  : 0;
                            const defaultViajeExcursiones = useProductActivities
                              ? getProductVisits(
                                  actividadProductoSeleccionada?.id,
                                )
                              : actividadSeleccionada
                                ? String(
                                    actividadSeleccionada.descripcion ?? "",
                                  ).trim()
                                : "";
                            const visitasProducto = getProductVisits(
                              selectedProduct?.id,
                            );
                            const nextViajeExcursiones =
                              defaultViajeExcursiones || visitasProducto;

                            if (
                              String(day.viajeExcursiones ?? "").trim() ===
                                "" &&
                              nextViajeExcursiones !== ""
                            ) {
                              setDayViajeExcursiones(
                                day.id,
                                day.viajeExcursiones ?? "",
                                nextViajeExcursiones,
                              );
                            }
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
                              ? getTrasladoUnitPrice(trasladoSeleccionado.id)
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
                            key={`${day.id}-${row.id}-${row.tipo}`}
                            className={`grid grid-cols-[160px_1fr_120px_120px_120px] border-b border-slate-200 last:border-b-0 ${
                              rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                              <span className="inline-flex items-center rounded-md bg-orange-500 text-white text-xs px-2.5 py-1 font-semibold tracking-wide">
                                {rowLabel}
                              </span>
                              {canPersist && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveEvent(day.id, row.id)}
                                  className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:border-red-200 hover:text-red-600"
                                >
                                  Quitar
                                </button>
                              )}
                            </div>

                            <div className="border-l border-slate-200 p-1.5">
                              {isActivityType(row.tipo) && (
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
                                        !selectedActivityDetails.includes(
                                          option,
                                        ) || row.detalle === option,
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
                                data-row-price-day={String(day.id)}
                                data-row-price-row={String(row.id)}
                                value={row.precio === 0 ? "" : row.precio}
                                onChange={(e) =>
                                  handlePrecioChange(e.target.value)
                                }
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
                                onChange={(e) =>
                                  handleCantChange(e.target.value)
                                }
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
                </>
              )}

              <div className="mt-6">
                <TextControlled<ItinerarySectionFormValues>
                  name={getViajeExcursionesFieldName(day.id)}
                  control={control}
                  label="Viaje / excursiones"
                  placeholder="Escribe el detalle de viaje / excursiones del día"
                  disableKeyboardNavigation
                  multiline
                  rows={3}
                  size="small"
                  disabled={isNoActivitySelected}
                  inputProps={{
                    "data-disable-form-arrow-nav": "true",
                    "data-viaje-excursiones-day": String(day.id),
                  }}
                  onChange={(e) =>
                    onUpdateDayField(day.id, "viajeExcursiones", e.target.value)
                  }
                  sx={{
                    backgroundColor: "white",
                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                  }}
                />
              </div>

              <div className="mt-3">
                <TextControlled<ItinerarySectionFormValues>
                  name={getObservationFieldName(day.id)}
                  control={control}
                  label="Observaciones del día"
                  placeholder="Escribe notas adicionales para este día"
                  disableKeyboardNavigation
                  multiline
                  rows={3}
                  size="small"
                  inputProps={{
                    "data-disable-form-arrow-nav": "true",
                    "data-observation-day": String(day.id),
                  }}
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
