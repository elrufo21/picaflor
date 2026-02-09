import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";

import DndTable from "@/components/dataTabla/DndTable";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/store/auth/auth.store";
import { fetchPedidosFecha } from "../api/fulldayApi";
import { usePackageStore } from "../store/fulldayStore";
import {
  DEFAULT_FORM_PAYLOAD,
  type ActivityDetail,
} from "./fulldayPassengerCreate";
import type { Producto } from "@/app/db/serviciosDB";
import {
  getServiciosFromDB,
  hasServiciosData,
  serviciosDB,
} from "@/app/db/serviciosDB";
import { useCanalVenta } from "../hooks/useCanalVenta";
import { ChevronLeft } from "lucide-react";

type BackendDetalle = {
  detalleId: number;
  actividades: string;
  hora?: string;
  precio: number | null;
  cantidad: number | null;
  turno?: string;
  importe: number | null;
};

function normalizeBackendDetalleToForm(detalles: BackendDetalle[]) {
  const emptyRow = {
    servicio: null,
    hora: "",
    turno: "",
    precio: 0,
    cant: 0,
    total: 0,
    detalleId: 0,
  };

  const rows = {
    tarifa: { ...emptyRow },
    act1: { ...emptyRow },
    act2: { ...emptyRow },
    act3: { ...emptyRow },
    traslado: { ...emptyRow },
    entrada: { ...emptyRow },
  };

  detalles.forEach((d, index) => {
    const rawLabel = String(d.actividades ?? "").trim();

    const isEntrada = index === 5;

    const baseNormal = {
      detalleId: d.detalleId,
      servicio: {
        value: rawLabel || "-",
        label: rawLabel || "-",
      },
      hora: d.hora ?? "",
      turno: d.turno ?? d.hora ?? "",
      precio: d.precio ?? 0,
      cant: d.cantidad ?? 0,
      total: d.importe ?? 0,
    };

    const baseEntrada = {
      detalleId: d.detalleId,
      servicio: rawLabel && rawLabel !== "-" ? rawLabel : "N/A",
      precio: d.precio ?? 0,
      cant: d.cantidad ?? 0,
      total: d.importe ?? 0,
    };

    if (index === 0) return (rows.tarifa = baseNormal);
    if (index >= 1 && index <= 3)
      return (rows[`act${index}` as "act1" | "act2" | "act3"] = baseNormal);
    if (index === 4) return (rows.traslado = baseNormal);
    if (index === 5) return (rows.entrada = baseEntrada);
  });
  return rows;
}

//fin detalle
const LEGACY_ROW_SEPARATOR = "\u00ac";

const FLAG_SERVICIO_OPTIONS = [
  { label: "Full day", value: 1 },
  { label: "City tour", value: 2 },
];

const normalizeStringValue = (value?: string) => String(value ?? "").trim();

const parseMoneyValue = (value?: string) => {
  if (!value) return 0;
  const normalized = String(value).replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseLegacyDate = (value?: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return trimmed;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
};

const LIQUIDACION_FIELDS = [
  { key: "notaId", label: "NotaId", sourceIndex: 0 },
  { key: "serieNumero", label: "Serie-Numero", sourceIndex: 1 },
  { key: "puntoPartida", label: "PuntoPartida", sourceIndex: 2 },
  { key: "productoNombre", label: "ProductoNombre", sourceIndex: 3 },
  { key: "fechaViaje", label: "FechaViaje", sourceIndex: 4 },
  { key: "fechaRegistro", label: "FechaRegistro", sourceIndex: 5 },
  { key: "clienteId", label: "ClienteId", sourceIndex: 6 },
  { key: "horaPartida", label: "HoraPartida", sourceIndex: 7 },
  { key: "clienteNombre", label: "ClienteNombre", sourceIndex: 8 },
  { key: "clienteTelefono", label: "ClienteTelefono", sourceIndex: 9 },
  { key: "notaUsuario", label: "NotaUsuario", sourceIndex: 10 },
  { key: "cantidadPax", label: "CantidadPax", sourceIndex: 11 },
  { key: "islas", label: "Islas", sourceIndex: 12 },
  { key: "tubulares", label: "Tubulares", sourceIndex: 13 },
  { key: "otros", label: "Otros", sourceIndex: 14 },
  {
    key: "fullPunto",
    label: "PuntoPartida + Hotel + OtrasPartidas",
    sourceIndex: 15,
  },
  { key: "condicion", label: "Condicion", sourceIndex: 16 },
  { key: "formaPago", label: "FormaPago", sourceIndex: 17 },
  { key: "totalPagar", label: "TotalPagar", sourceIndex: 18 },
  { key: "acuenta", label: "Acuenta", sourceIndex: 19 },
  { key: "saldo", label: "Saldo", sourceIndex: 20 },
  { key: "auxiliar", label: "Auxiliar", sourceIndex: 21 },
  { key: "observaciones", label: "Observaciones", sourceIndex: 22 },
  { key: "ganancia", label: "Ganancia", sourceIndex: 23 },
  { key: "subtotal", label: "Subtotal", sourceIndex: 24 },
  { key: "igv", label: "IGV", sourceIndex: 25 },
  { key: "adicional", label: "Adicional", sourceIndex: 26 },
  { key: "estado", label: "Estado", sourceIndex: 27 },
  { key: "modificadoPor", label: "ModificadoPor", sourceIndex: 28 },
  { key: "fechaEdita", label: "FechaEdita", sourceIndex: 29 },
  { key: "serie", label: "Serie", sourceIndex: 30 },
  { key: "numero", label: "Numero", sourceIndex: 31 },
  { key: "efectivo", label: "Efectivo", sourceIndex: 32 },
  { key: "deposito", label: "Deposito", sourceIndex: 33 },
  { key: "entidadBancaria", label: "EntidadBancaria", sourceIndex: 34 },
  { key: "nroOperacion", label: "NroOperacion", sourceIndex: 35 },
  { key: "telefonoAuxiliar", label: "TelefonoAuxiliar", sourceIndex: 36 },
  { key: "visitasExCur", label: "VisitasExCur", sourceIndex: 37 },
  { key: "cobroExtraSol", label: "CobroExtraSol", sourceIndex: 38 },
  { key: "cobroExtraDol", label: "CobroExtraDol", sourceIndex: 39 },
  { key: "fechaAdelanto", label: "FechaAdelanto", sourceIndex: 40 },
  { key: "otrasPartidas", label: "OtrasPartidas", sourceIndex: 41 },
  { key: "incluyeIgv", label: "IncluyeIGV", sourceIndex: 42 },
  { key: "incluyeCargos", label: "IncluyeCargos", sourceIndex: 43 },
  { key: "moneda", label: "Moneda", sourceIndex: 44 },
  { key: "incluyeAlmuerzo", label: "IncluyeAlmuerzo", sourceIndex: 45 },
  { key: "notaImagen", label: "NotaImagen", sourceIndex: 46 },
  { key: "clienteDni", label: "ClienteDNI", sourceIndex: 47 },
  { key: "notaDocu", label: "NotaDocu", sourceIndex: 48 },
  { key: "hotel", label: "Hotel", sourceIndex: 49 },
  { key: "regionProducto", label: "RegionProducto", sourceIndex: 50 },
  { key: "regionNota", label: "RegionNota", sourceIndex: 51 },
  { key: "flagServicio", label: "FlagServicio", sourceIndex: 52 }, // 👈 NUEVO
] as const;

type LiquidacionFieldDefinition = (typeof LIQUIDACION_FIELDS)[number];
type LiquidacionFieldKey = LiquidacionFieldDefinition["key"];
type LiquidacionRow = Record<LiquidacionFieldKey, string> & {
  id: string;
  companiaId?: string;
  CompaniaId?: string;
};

const EXPECTED_FIELDS =
  Math.max(...LIQUIDACION_FIELDS.map((field) => field.sourceIndex)) + 1;

const parseLiquidacionRow = (
  rowText: string,
  index: number,
): LiquidacionRow => {
  const rawValues = rowText.split("|");
  const normalizedValues =
    rawValues.length > EXPECTED_FIELDS
      ? rawValues
          .slice(0, EXPECTED_FIELDS - 1)
          .concat(rawValues.slice(EXPECTED_FIELDS - 1).join("|"))
      : rawValues;

  const rowRecord = LIQUIDACION_FIELDS.reduce(
    (acc, field) => {
      const value = normalizedValues[field.sourceIndex] ?? "";
      acc[field.key] = value.trim();
      return acc;
    },
    {} as Record<LiquidacionFieldKey, string>,
  );

  return {
    ...rowRecord,
    id: rowRecord.notaId || String(index + 1),
  };
};

const parseLiquidacionesPayload = (payload: string | null | undefined) => {
  const trimmed = String(payload ?? "").trim();
  if (!trimmed || trimmed === "~") return [];

  const normalized = trimmed.replace(/~/g, LEGACY_ROW_SEPARATOR);

  const rows = normalized
    .split(LEGACY_ROW_SEPARATOR)
    .map((row) => row.trim())
    .filter((row) => row && row !== "~");

  return rows.map((row, index) => parseLiquidacionRow(row, index));
};

const normalizeProductName = (value?: string) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const buildLiquidacionFormData = (row: LiquidacionRow) => {
  const normalizedName = normalizeProductName(row.productoNombre);
  const normalizedContact = normalizeStringValue(row.clienteTelefono);
  return {
    nombreCompleto: normalizeStringValue(row.clienteNombre),
    documentoNumero: normalizeStringValue(row.clienteDni),
    celular: normalizedContact,
    telefono: normalizedContact,
    cantPax: Number(normalizeStringValue(row.cantidadPax)) || 0,
    fechaViaje: parseLegacyDate(row.fechaViaje),
    fechaPago: parseLegacyDate(row.fechaAdelanto || row.fechaViaje),
    horaPresentacion: normalizeStringValue(row.horaPartida),
    puntoPartida: normalizeStringValue(row.puntoPartida),
    hotel: normalizeStringValue(row.hotel),
    otrosPartidas: normalizeStringValue(row.otrasPartidas),
    destino: normalizedName,
    medioPago: normalizeStringValue(row.formaPago).toUpperCase(),
    precioVenta: parseMoneyValue(row.totalPagar),
    acuenta: parseMoneyValue(row.acuenta),
    saldo: parseMoneyValue(row.saldo),
    deposito: parseMoneyValue(row.deposito),
    efectivo: parseMoneyValue(row.efectivo),
    entidadBancaria: normalizeStringValue(row.entidadBancaria),
    nroOperacion: normalizeStringValue(row.nroOperacion),
    notas: normalizeStringValue(row.observaciones),
    documentoCobranza:
      normalizeStringValue(row.notaDocu) || "DOCUMENTO DE COBRANZA",
    notaDocu: normalizeStringValue(row.notaDocu),
    destinoNombre: normalizedName,
    canalVenta: normalizeStringValue(row.auxiliar),
    condicion: normalizeStringValue(row.condicion),
    clienteId: normalizeStringValue(row.clienteId),
  };
};

type PartidaRecord = {
  id: number;
  partida: string;
};

const resolvePartidaId = (label?: string, partidas?: PartidaRecord[]) => {
  if (!label) return undefined;
  const normalizedLabel = normalizeStringValue(label);
  return partidas?.find(
    (partidaOption) =>
      normalizeStringValue(partidaOption.partida) === normalizedLabel,
  )?.id;
};

const normalizeLiquidacionForForm = (
  row: LiquidacionRow,
  detalle?: ActivityDetail[],
  partidas?: PartidaRecord[],
) => {
  const base = {
    ...DEFAULT_FORM_PAYLOAD,
    ...buildLiquidacionFormData(row),
  };
  const canalLabel = normalizeStringValue(row.auxiliar);
  base.canalVenta = {
    value: canalLabel
      ? canalLabel.toUpperCase().replace(/\s+/g, "_")
      : (base.canalVenta?.value ?? ""),
    label: canalLabel || base.canalVenta?.label || "",
    telefono: normalizeStringValue(row.telefonoAuxiliar),
    auxiliar: canalLabel,
  };
  const condicionValue = normalizeStringValue(row.condicion);
  const normalizedCondicion =
    condicionValue.charAt(0).toUpperCase() +
    condicionValue.slice(1).toLowerCase();
  base.condicion = {
    value: condicionValue.toUpperCase(),
    label: normalizedCondicion || base.condicion?.label || "",
  };
  base.acuenta = parseMoneyValue(row.acuenta);
  base.efectivo = parseMoneyValue(row.efectivo);
  base.deposito = parseMoneyValue(row.deposito);
  base.cobroExtraSol = parseMoneyValue(row.cobroExtraSol);
  base.cobroExtraDol = parseMoneyValue(row.cobroExtraDol);
  const resolvedPartida = resolvePartidaId(
    row.puntoPartida ?? row.fullPunto,
    partidas,
  );
  base.puntoPartida = resolvedPartida
    ? String(resolvedPartida)
    : normalizeStringValue(row.puntoPartida);
  base.horaPresentacion = normalizeStringValue(row.horaPartida);
  base.otrosPartidas = normalizeStringValue(row.otrasPartidas);
  base.hotel = normalizeStringValue(row.hotel);
  base.visitas = normalizeStringValue(row.visitasExCur);
  base.destino = normalizeStringValue(row.productoNombre);
  base.medioPago = normalizeStringValue(row.formaPago).toUpperCase();
  base.documentoCobranza =
    normalizeStringValue(row.notaDocu) || base.documentoCobranza;
  base.notaDocu = normalizeStringValue(row.notaDocu);
  if (detalle?.length) {
    base.detalleActividades = detalle;
  }
  return base;
};

const fetchDetalleActividades = async (notaId: string) => {
  if (!notaId) return [];
  try {
    const response = await fetch(
      `${API_BASE_URL}/Programacion/traer-actividades/${notaId}`,
      {
        method: "GET",
        headers: {
          accept: "text/plain",
        },
      },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error cargando actividades", error);
    return [];
  }
};
function parseFechaBackend(value?: string) {
  if (!value || value === "-") return "";
  const [d, m, y] = value.split("/");
  return `${y}-${m}-${d}`;
}

const LiquidacionesPage = () => {
  const { canalVentaList } = useCanalVenta();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const initialFlagServicio = useMemo(() => {
    const raw =
      searchParams.get("flagServicio") ?? searchParams.get("companiaId");
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);
  const { loadServicios, loadServiciosFromDB, setFormData } = usePackageStore();
  const [rows, setRows] = useState<LiquidacionRow[]>([]);
  const [allRows, setAllRows] = useState<LiquidacionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const todayValue = useMemo(() => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
  }, []);
  const [pendingStartDate, setPendingStartDate] = useState(todayValue);
  const [pendingEndDate, setPendingEndDate] = useState(todayValue);
  const pendingStartDateRef = useRef(pendingStartDate);
  const pendingEndDateRef = useRef(pendingEndDate);
  const initialReloadRef = useRef(false);
  const productosLoadedRef = useRef(false);
  useEffect(() => {
    pendingStartDateRef.current = pendingStartDate;
  }, [pendingStartDate]);
  useEffect(() => {
    pendingEndDateRef.current = pendingEndDate;
  }, [pendingEndDate]);

  const [selectedFlagServicio, setSelectedFlagServicio] = useState<
    number | null
  >(initialFlagServicio);
  const [searchNumber, setSearchNumber] = useState("");
  const [searchResults, setSearchResults] = useState<LiquidacionRow[] | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const stopNumberSearch = useCallback(() => {
    setSearchNumber("");
    searchAbortRef.current?.abort();
    searchAbortRef.current = null;
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    setSearchResults(null);
    setSearchLoading(false);
    setSearchError(null);
  }, [setSearchNumber, setSearchResults, setSearchLoading, setSearchError]);

  useEffect(() => {
    setSelectedFlagServicio(initialFlagServicio);
  }, [initialFlagServicio]);

  const filterRowsByFlagServicio = useCallback(
    (sourceRows: LiquidacionRow[]) => {
      if (!selectedFlagServicio) return sourceRows;

      return sourceRows.filter((row) => {
        const candidate = Number(row.flagServicio ?? 0);
        return candidate === selectedFlagServicio;
      });
    },
    [selectedFlagServicio],
  );

  useEffect(() => {
    const hasNumberQuery = Boolean(searchNumber.trim());
    const sourceRows = hasNumberQuery ? (searchResults ?? []) : allRows;
    setRows(filterRowsByFlagServicio(sourceRows));
  }, [allRows, filterRowsByFlagServicio, searchNumber, searchResults]);

  useEffect(() => {
    const trimmedNumber = searchNumber.trim();

    if (!trimmedNumber) {
      searchAbortRef.current?.abort();
      searchAbortRef.current = null;
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
      setSearchResults(null);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    searchAbortRef.current?.abort();
    searchAbortRef.current = null;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      searchAbortRef.current = controller;
      setSearchLoading(true);
      setSearchError(null);

      fetch(
        `${API_BASE_URL}/Programacion/lista-pedidos-numero?numero=${encodeURIComponent(
          trimmedNumber,
        )}`,
        { signal: controller.signal },
      )
        .then(async (response) => {
          if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Error buscando por número");
          }
          return response.text();
        })
        .then((text) => {
          const parsedRows = parseLiquidacionesPayload(text);
          setSearchResults(parsedRows);
        })
        .catch((error) => {
          if ((error as any)?.name === "AbortError") return;
          setSearchError("No se pudo buscar por número");
          setSearchResults([]);
        })
        .finally(() => {
          setSearchLoading(false);
          searchAbortRef.current = null;
        });
    }, 1000);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [searchNumber]);

  useEffect(() => {
    if (productosLoadedRef.current) {
      return;
    }
    productosLoadedRef.current = true;
    let canceled = false;
    const loadProductos = async () => {
      try {
        const hasData = await hasServiciosData();
        if (hasData) {
          await loadServiciosFromDB();
        } else {
          await loadServicios();
        }
        const pCityTour = await serviciosDB.productosCityTourOrdena.toArray();
        const pFullDay = await serviciosDB.productos.toArray();
        const stored = [...pFullDay, ...pCityTour];
        if (!canceled) {
          setProductos(stored);
        }
      } catch (err) {
        console.error("Error cargando productos", err);
      }
    };
    loadProductos();
    return () => {
      canceled = true;
    };
  }, [loadServicios, loadServiciosFromDB]);
  const resolveProductId = (row: LiquidacionRow) => {
    const normalizedRowName = normalizeProductName(row.productoNombre);
    if (!normalizedRowName) return 0;
    const exactMatch = productos.find(
      (product) => normalizeProductName(product.nombre) === normalizedRowName,
    );
    if (exactMatch) return exactMatch.id;
    const containsMatch = productos.find((product) =>
      normalizedRowName.includes(normalizeProductName(product.nombre)),
    );
    if (containsMatch) return containsMatch.id;
    return 0;
  };
  function normalizeBackendDetalleToFormCityTour(
    detalles: BackendDetalle[],
    serviciosCatalogo: any[],
  ) {
    const emptyServicio = {
      label: "-",
      value: "0",
      id: "0",
      descripcion: "",
    };

    const serviciosMap = new Map(
      serviciosCatalogo.map((s) => [s.actividad.trim().toLowerCase(), s]),
    );

    const findServicio = (actividad: string) => {
      const match = serviciosMap.get(actividad.trim().toLowerCase());

      if (!match) return emptyServicio;

      return {
        label: match.actividad,
        value: String(match.id),
        id: String(match.id),
        descripcion: match.descripcion ?? "",
      };
    };

    const buildNormalRow = (d: BackendDetalle) => ({
      detalleId: d.detalleId,
      servicio: findServicio(d.actividades),
      hora: d.hora ?? "",
      turno: d.turno ?? d.hora ?? "",
      precio: d.precio ?? 0,
      cant: d.cantidad ?? 0,
      total: d.importe ?? 0,
    });

    const buildEntradaRow = (d: BackendDetalle) => ({
      detalleId: d.detalleId,
      servicio: findServicio(d.actividades),
      precio: d.precio ?? 0,
      cant: d.cantidad ?? 0,
      total: d.importe ?? 0,
    });

    const emptyRow = {
      servicio: emptyServicio,
      hora: "",
      turno: "",
      precio: 0,
      cant: 0,
      total: 0,
      detalleId: 0,
    };

    const rows = {
      tarifa: { ...emptyRow },
      act1: { ...emptyRow },
      act2: { ...emptyRow },
      act3: { ...emptyRow },
      traslado: { ...emptyRow },
      entrada: {
        detalleId: 0,
        servicio: emptyServicio,
        precio: 0,
        cant: 0,
        total: 0,
      },
    };

    detalles.forEach((d, index) => {
      if (index === 0) rows.tarifa = buildNormalRow(d);
      if (index >= 1 && index <= 3)
        rows[`act${index}` as "act1" | "act2" | "act3"] = buildNormalRow(d);
      if (index === 4) rows.traslado = buildNormalRow(d);
      if (index === 5) rows.entrada = buildEntradaRow(d);
    });

    return rows;
  }

  const findServicio = (actividad: string) => {
    const match = serviciosMap.get(actividad.trim().toLowerCase());

    const buildNormalRow = (d: BackendDetalle) => {
      const servicio = findServicio(d.actividades);

      return {
        detalleId: d.detalleId,
        servicio,
        hora: d.hora ?? "",
        turno: d.turno ?? d.hora ?? "",
        precio: d.precio ?? 0,
        cant: d.cantidad ?? 0,
        total: d.importe ?? 0,
      };
    };

    const buildEntradaRow = (d: BackendDetalle) => {
      const servicio = findServicio(d.actividades);

      return {
        detalleId: d.detalleId,
        servicio,
        precio: d.precio ?? 0,
        cant: d.cantidad ?? 0,
        total: d.importe ?? 0,
      };
    };

    detalles.forEach((d, index) => {
      if (index === 0) return (rows.tarifa = buildNormalRow(d));
      if (index >= 1 && index <= 3)
        return (rows[`act${index}` as "act1" | "act2" | "act3"] =
          buildNormalRow(d));
      if (index === 4) return (rows.traslado = buildNormalRow(d));
      if (index === 5) return (rows.entrada = buildEntradaRow(d));
    });

    return rows;
  };
  const resolveProductIdFromList = (list: Producto[], row: LiquidacionRow) => {
    const normalizedRowName = normalizeProductName(row.productoNombre);
    if (!normalizedRowName) return 0;

    const exactMatch = list.find(
      (p) => normalizeProductName(p.nombre) === normalizedRowName,
    );
    if (exactMatch) return exactMatch.id;

    const containsMatch = list.find(
      (p) =>
        normalizeProductName(p.nombre) &&
        normalizedRowName.includes(normalizeProductName(p.nombre)),
    );
    return containsMatch?.id ?? 0;
  };

  const handleView = async (row: LiquidacionRow) => {
    const productosLocal = await ensureProductosLoaded();
    try {
      await loadCanalVenta();
    } catch (error) {
      console.warn("No se pudieron cargar canales de venta", error);
    }
    const servicios = await getServiciosFromDB();
    const data = row;
    const detalle = await fetchDetalleActividades(row.notaId);
    const hoteles = await serviciosDB.hoteles.toArray();
    const hotel = hoteles.find((h) => h.nombre === row.hotel);
    const canalDeVenta = canalVentaList.find(
      (c) => c.auxiliar === row.auxiliar,
    );
    const normalizedData = {
      notaId: Number(data.notaId ?? data.id),

      destino: data.productoNombre,
      region: data.regionProducto,

      fechaViaje: parseFechaBackend(data.fechaViaje),
      fechaEmision: parseFechaBackend(data.fechaRegistro?.split(" ")[0]),
      fechaRegistro: data.fechaRegistro,
      counter: data.notaUsuario,
      canalVenta: null,
      canalDeVentaTelefono: data.telefonoAuxiliar,

      nombreCompleto: data.clienteNombre,
      documentoNumero: data.clienteDni,
      celular: data.clienteTelefono,
      cantPax: Number(data.cantidadPax),
      auxiliar: data.auxiliar,
      horaPartida: data.horaPartida,
      visitas: data.visitasExCur,

      medioPago: data.formaPago,
      condicion: {
        value: data.condicion,
        label: data.condicion,
      },
      moneda: data.moneda,
      otrosPartidas: data.otrasPartidas,
      acuenta: Number(data.acuenta),
      saldo: Number(data.saldo),
      precioTotal: Number(data.totalPagar),
      totalGeneral: Number(data.totalPagar),

      entidadBancaria: data.entidadBancaria,
      nroOperacion: data.nroOperacion,
      efectivo: Number(data.efectivo),
      deposito: Number(data.deposito),

      documentoCobranza: data.notaDocu,

      precioExtra: Number(data.adicional),
      observaciones: data.observaciones,
      detalle:
        row.flagServicio == "1"
          ? normalizeBackendDetalleToForm(detalle)
          : normalizeBackendDetalleToFormCityTour(
              detalle,
              servicios.actividades,
            ),
      detallexd:
        row.flagServicio == "1"
          ? normalizeBackendDetalleToForm(detalle)
          : normalizeBackendDetalleToFormCityTour(
              detalle,
              servicios.actividades,
            ),
      canalDeVenta,
      hotel: hotel ? { label: hotel?.nombre, value: Number(hotel?.id) } : null,
      puntoPartida: data.puntoPartida,
      nserie: data.serie,
      ndocumento: data.numero,
      clienteId: data.clienteId,
      _editMode: true,
      estado: data.estado,
    };
    const productId = resolveProductIdFromList(productosLocal, row);
    const targetId = productId || Number(row.notaId) || Number(row.id) || 0;
    if (!targetId) {
      setError("No se pudo determinar la programación asociada");
      return;
    }
    if (row.flagServicio == "1") {
      navigate(`/fullday/${targetId}/passengers/view/${row.notaId}`, {
        state: { formData: normalizedData },
      });
    } else if (row.flagServicio == "2") {
      navigate(`/citytour/${targetId}/passengers/view/${row.notaId}`, {
        state: { formData: normalizedData },
      });
    }
  };

  const columnHelper = createColumnHelper<LiquidacionRow>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "acciones",
        size: 80,

        header: "Ver",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => void handleView(row.original)}
            className="text-sm cursor-pointer font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Ver
          </button>
        ),
      }),
      columnHelper.accessor("notaId", {
        header: "Número",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("productoNombre", {
        header: "Tours",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("fechaViaje", {
        header: "FechaViaje",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("fechaRegistro", {
        header: "Registro",
        cell: (info) => info.getValue(),
      }),

      columnHelper.accessor("horaPartida", {
        header: "Horapartida",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("auxiliar", {
        header: "Canal de venta",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("clienteNombre", {
        header: "Pasajero",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("clienteTelefono", {
        header: "Celular",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("notaUsuario", {
        header: "Counter",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("condicion", {
        header: "Condicion",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("formaPago", {
        header: "Forma de pago",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("totalPagar", {
        header: "Total",
        cell: (info) => info.getValue(),
        meta: { align: "right" },
      }),
      columnHelper.accessor("acuenta", {
        header: "Acuenta",
        cell: (info) => info.getValue(),
        meta: { align: "right" },
      }),
      columnHelper.accessor("saldo", {
        header: "Saldo",
        cell: (info) => info.getValue(),
        meta: { align: "right" },
      }),
      columnHelper.accessor("estado", {
        header: "Estado",
        cell: (info) => info.getValue(),
      }),
    ],
    [columnHelper, navigate],
  );
  const productosPromiseRef = useRef<Promise<Producto[]> | null>(null);

  const ensureProductosLoaded = useCallback(async () => {
    // Si ya hay productos en memoria, listo
    if (productos.length) return productos;

    // Evita cargas duplicadas si spamean el botón
    if (productosPromiseRef.current) return productosPromiseRef.current;

    productosPromiseRef.current = (async () => {
      const hasData = await hasServiciosData();
      if (hasData) await loadServiciosFromDB();
      else await loadServicios();

      const pCityTour = await serviciosDB.productosCityTourOrdena.toArray();
      const pFullDay = await serviciosDB.productos.toArray();

      const stored = [...pFullDay, ...pCityTour];
      setProductos(stored);
      return stored;
    })();

    try {
      return await productosPromiseRef.current;
    } finally {
      productosPromiseRef.current = null;
    }
  }, [productos, loadServicios, loadServiciosFromDB]);

  const reload = useCallback(
    async (startDate?: string, endDate?: string) => {
      if (!user) {
        setError("Usuario no autenticado");
        return;
      }
      const areaId = Number(user.areaId ?? user.area ?? 0);
      const usuarioId = Number(user.id ?? 0);
      const rangeStart = startDate ?? pendingStartDateRef.current ?? todayValue;
      const rangeEnd = endDate ?? pendingEndDateRef.current ?? todayValue;
      if (!areaId || !usuarioId) {
        setError("Falta área o usuario");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const payload: Parameters<typeof fetchPedidosFecha>[0] = {
          fechaInicio: rangeStart,
          fechaFin: rangeEnd,
          areaId,
          usuarioId,
        };

        const response = await fetchPedidosFecha(payload);
        const parsedRows = parseLiquidacionesPayload(response);
        setAllRows(parsedRows);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo cargar las liquidaciones";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [todayValue, user],
  );

  const handleRangeSearch = () => {
    stopNumberSearch();
    reload(pendingStartDate, pendingEndDate);
  };

  const handleListAll = () => {
    const start = todayValue;
    const end = todayValue;
    setPendingStartDate(start);
    setPendingEndDate(end);
    reload(start, end);
  };

  useEffect(() => {
    if (initialReloadRef.current) return;
    initialReloadRef.current = true;
    reload();
  }, [reload]);
  const refreshKey = location.state?.refresh;
  useEffect(() => {
    if (refreshKey) {
      reload();
    }
  }, [refreshKey, reload]);
  const endDateRef = useRef<HTMLInputElement | null>(null);
  const DateRangeFilter = () => (
    <div
      className="
                flex flex-col gap-3
                md:flex-row md:items-end md:gap-4
              "
    >
      <div className="text-sm font-semibold text-slate-900">Buscar por</div>

      <div className="flex flex-col text-xs text-slate-500">
        <span>Fecha Inicio</span>
        <input
          type="date"
          value={pendingStartDate}
          onChange={(e) => setPendingStartDate(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              endDateRef.current?.focus();
            }
          }}
          className="
      w-full md:w-32
      rounded-md border border-slate-200
      bg-white/80 px-2 py-1
      text-xs text-slate-700
    "
        />
      </div>

      <div className="flex flex-col text-xs text-slate-500">
        <span>Fecha Fin</span>
        <input
          ref={endDateRef}
          type="date"
          value={pendingEndDate}
          onChange={(e) => {
            const value = e.target.value;
            setPendingEndDate(value);

            reload(pendingStartDateRef.current, value);
          }}
          className="
      w-full md:w-32
      rounded-md border border-slate-200
      bg-white/80 px-2 py-1
      text-xs text-slate-700
    "
        />
      </div>

      <div className="flex flex-col text-xs text-slate-500">
        <span>Servicio</span>
        <select
          value={selectedFlagServicio ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedFlagServicio(value ? Number(value) : null);
          }}
          className="
        w-full md:w-32
        rounded-md border border-slate-200
        bg-white/80 px-2 py-1
        text-xs text-slate-700
      "
        >
          <option value="">Todas</option>
          {FLAG_SERVICIO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col text-xs text-slate-500">
        <span>Número de pedido</span>
        <input
          type="text"
          value={searchNumber}
          onChange={(e) => setSearchNumber(e.target.value)}
          placeholder="Ej. 12345"
          className="
        w-full md:w-40
        rounded-md border border-slate-200
        bg-white/80 px-2 py-1
        text-xs text-slate-700
      "
        />
        {searchLoading && (
          <span className="mt-1 text-[0.65rem] text-slate-500">
            Buscando...
          </span>
        )}
        {searchError && (
          <span className="mt-1 text-[0.65rem] text-red-600">
            {searchError}
          </span>
        )}
      </div>

      {/* ACCIONES */}
      <div
        className="
      flex gap-4
      md:items-center
    "
      >
        <button
          type="button"
          onClick={handleRangeSearch}
          disabled={loading}
          className="
        text-sm font-semibold text-slate-700
        underline-offset-2 hover:underline
        disabled:opacity-60
      "
        >
          Buscar
        </button>

        <button
          type="button"
          onClick={handleListAll}
          className="
        text-sm font-semibold text-slate-500
        underline-offset-2 hover:underline
      "
        >
          Listar todo
        </button>
      </div>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <ChevronLeft
          className="cursor-pointer"
          onClick={() => {
            navigate("/fullday");
          }}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DndTable
        data={rows}
        columns={columns}
        searchColumns={[
          "productoNombre",
          "auxiliar",
          "clienteNombre",
          "notaUsuario",
          "condicion",
          "formaPago",
          "estado",
          "notaId",
        ]}
        enableSearching
        isLoading={loading}
        emptyMessage="No se encontraron liquidaciones"
        dateFilterComponent={DateRangeFilter}
        enableRowSelection={false}
        rowColorRules={[
          {
            when: (row) => row.condicion === "CREDITO",
            className: "bg-orange-200 text-orange-700",
          },
          {
            when: (row) => row.estado === "ANULADO",
            className: "bg-red-50 text-red-700",
          },
          {
            when: (row) => row.estado === "PENDIENTE",
            className: "bg-yellow-50 text-yellow-800",
          },
          {
            when: (row) => row.estado === "CANCELADO",
            className: "bg-white text-slate-900",
          },
        ]}
      />
    </div>
  );
};

export default LiquidacionesPage;
