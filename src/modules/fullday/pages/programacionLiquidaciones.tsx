import * as XLSX from "xlsx-js-style";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  createColumnHelper,
  type PaginationState,
} from "@tanstack/react-table";
import { Autocomplete, TextField } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Check, ChevronLeft, FileSpreadsheet, Search, X } from "lucide-react";
import dayjs from "dayjs";

import DndTable from "@/components/dataTabla/DndTable";
import { API_BASE_URL } from "@/config";
import { normalizeLegacyXmlPayload } from "@/shared/helpers/normalizeLegacyXmlPayload";
import { toPlainText } from "@/shared/helpers/safeText";
import { useAuthStore } from "@/store/auth/auth.store";
import { fetchLiquidacionNota, fetchPedidosFecha } from "../api/fulldayApi";
import { usePackageStore } from "../store/fulldayStore";
import {
  DEFAULT_FORM_PAYLOAD,
  type ActivityDetail,
} from "./fulldayPassengerCreate";
import type { Producto } from "@/app/db/serviciosDB";
import { hasServiciosData, serviciosDB } from "@/app/db/serviciosDB";
import { useCanalVenta } from "../hooks/useCanalVenta";
import { showToast } from "@/components/ui/AppToast";

type BackendDetalle = {
  detalleId: number;
  actividades: string;
  hora?: string;
  precio: number | null;
  cantidad: number | null;
  turno?: string;
  importe: number | null;
  idProducto?: number | null;
  idProductoDetalle?: number | null;
  IdProducto?: number | null;
  IdProductoDetalle?: number | null;
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
    const rawLabel = normalizeStringValue(d.actividades);

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

const CONDICION_OPTIONS = [
  { label: "TODOS", value: "TODOS" },
  { label: "ACUENTA", value: "ACUENTA" },
  { label: "CANCELADO", value: "CANCELADO" },
  { label: "CREDITO", value: "CREDITO" },
] as const;

type CondicionFilterValue = (typeof CONDICION_OPTIONS)[number]["value"];

type SearchMode = "none" | "numero" | "canal";
type CanalRecordLike =
  | string
  | {
      nombre?: string | null;
      auxiliar?: string | null;
      canal?: string | null;
      descripcion?: string | null;
      label?: string | null;
      value?: string | null;
      [key: string]: unknown;
    };

const normalizeStringValue = (value?: string) =>
  toPlainText(normalizeLegacyXmlPayload(String(value ?? ""))).trim();
const normalizeCondicionFilter = (value?: string) =>
  normalizeStringValue(value).toUpperCase().replace(/\s+/g, "");

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

const normalizeCurrencyForTotals = (value?: string) => {
  const currency = normalizeStringValue(value).toUpperCase();
  if (
    currency === "DOL" ||
    currency === "DOLAR" ||
    currency === "DOLARES" ||
    currency === "USD" ||
    currency === "$"
  ) {
    return "DOLARES";
  }
  if (
    currency === "SOL" ||
    currency === "SOLES" ||
    currency === "PEN" ||
    currency === "S/" ||
    currency === "S/."
  ) {
    return "SOLES";
  }
  return normalizeLegacyCurrencyToUi(currency);
};

const formatTotalsAmount = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const LIQUIDACIONES_FILTERS_STORAGE_KEY =
  "fullday:programacion-liquidaciones:filters:v1";
const LIQUIDACIONES_PAGINATION_STORAGE_KEY =
  "fullday:programacion-liquidaciones:pagination:v1";
const LIQUIDACIONES_PAGINATION_RESET_EVENT =
  "picaflor:fullday-programacion:reset-pagination";
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LIQUIDACIONES_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
const LIQUIDACIONES_DEFAULT_PAGE_SIZE = 10;

type PersistedLiquidacionesFilters = {
  pendingStartDate?: string;
  pendingEndDate?: string;
  selectedFlagServicio?: number | null;
  selectedCondicion?: CondicionFilterValue;
  searchByFechaViaje?: boolean;
  searchMode?: SearchMode;
  searchNumber?: string;
  searchCanal?: string | null;
  searchCanalInput?: string;
};

type InitialLiquidacionesFilters = {
  pendingStartDate: string;
  pendingEndDate: string;
  selectedFlagServicio: number | null;
  selectedCondicion: CondicionFilterValue;
  searchByFechaViaje: boolean;
  searchMode: SearchMode;
  searchNumber: string;
  searchCanal: string | null;
  searchCanalInput: string;
};

const parseDateFilterValue = (value: unknown): string | null => {
  const normalized = normalizeStringValue(String(value ?? ""));
  return DATE_INPUT_PATTERN.test(normalized) ? normalized : null;
};

const parseFlagServicioFilterValue = (value: unknown): number | null => {
  const raw = normalizeStringValue(String(value ?? ""));
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return FLAG_SERVICIO_OPTIONS.some((option) => option.value === parsed)
    ? parsed
    : null;
};

const parseCondicionFilterValue = (
  value: unknown,
): CondicionFilterValue | null => {
  const normalized = normalizeStringValue(String(value ?? "")).toUpperCase();
  if (!normalized) return null;
  return CONDICION_OPTIONS.some((option) => option.value === normalized)
    ? (normalized as CondicionFilterValue)
    : null;
};

const parseSearchModeValue = (value: unknown): SearchMode | null => {
  const normalized = normalizeStringValue(String(value ?? "")).toLowerCase();
  if (normalized === "none") return "none";
  if (normalized === "numero") return "numero";
  if (normalized === "canal") return "canal";
  return null;
};
const parseBooleanFilterValue = (value: unknown): boolean | null => {
  const normalized = normalizeStringValue(String(value ?? "")).toLowerCase();
  if (!normalized) return null;
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return null;
};

const readPersistedLiquidacionesFilters = (): PersistedLiquidacionesFilters => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(
      LIQUIDACIONES_FILTERS_STORAGE_KEY,
    );
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as PersistedLiquidacionesFilters)
      : {};
  } catch {
    return {};
  }
};

const writePersistedLiquidacionesFilters = (
  filters: PersistedLiquidacionesFilters,
) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      LIQUIDACIONES_FILTERS_STORAGE_KEY,
      JSON.stringify(filters),
    );
  } catch {
    // ignorar errores de almacenamiento para no afectar la pantalla
  }
};

const readPersistedLiquidacionesPagination = (): PaginationState => {
  if (typeof window === "undefined") {
    return { pageIndex: 0, pageSize: LIQUIDACIONES_DEFAULT_PAGE_SIZE };
  }

  try {
    const raw = window.sessionStorage.getItem(
      LIQUIDACIONES_PAGINATION_STORAGE_KEY,
    );

    if (!raw) {
      return { pageIndex: 0, pageSize: LIQUIDACIONES_DEFAULT_PAGE_SIZE };
    }

    const parsed = JSON.parse(raw) as {
      pageIndex?: number;
      pageSize?: number;
    };

    const pageIndex =
      typeof parsed?.pageIndex === "number" && parsed.pageIndex >= 0
        ? Math.floor(parsed.pageIndex)
        : 0;

    const pageSizeCandidate =
      typeof parsed?.pageSize === "number" ? Math.floor(parsed.pageSize) : 0;
    const pageSize = LIQUIDACIONES_PAGE_SIZE_OPTIONS.includes(
      pageSizeCandidate as (typeof LIQUIDACIONES_PAGE_SIZE_OPTIONS)[number],
    )
      ? pageSizeCandidate
      : LIQUIDACIONES_DEFAULT_PAGE_SIZE;

    return { pageIndex, pageSize };
  } catch {
    return { pageIndex: 0, pageSize: LIQUIDACIONES_DEFAULT_PAGE_SIZE };
  }
};

const writePersistedLiquidacionesPagination = (pagination: PaginationState) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      LIQUIDACIONES_PAGINATION_STORAGE_KEY,
      JSON.stringify({
        pageIndex: Math.max(0, Number(pagination.pageIndex) || 0),
        pageSize:
          Number(pagination.pageSize) || LIQUIDACIONES_DEFAULT_PAGE_SIZE,
      }),
    );
  } catch {
    // ignorar errores de almacenamiento para no afectar la pantalla
  }
};

const resolveInitialLiquidacionesFilters = (
  search: string,
  today: string,
): InitialLiquidacionesFilters => {
  const persisted = readPersistedLiquidacionesFilters();
  const params = new URLSearchParams(search);

  const startFromQuery = parseDateFilterValue(params.get("fechaInicio"));
  const endFromQuery = parseDateFilterValue(params.get("fechaFin"));
  const flagFromQuery = parseFlagServicioFilterValue(
    params.get("flagServicio") ?? params.get("companiaId"),
  );
  const condicionFromQuery = parseCondicionFilterValue(params.get("condicion"));
  const fechaViajeFromQuery = parseBooleanFilterValue(params.get("esViaje"));
  const modeFromQuery = parseSearchModeValue(params.get("searchMode"));
  const numberFromQuery = normalizeStringValue(
    params.get("searchNumber") ?? "",
  );
  const canalFromQuery = normalizeStringValue(params.get("searchCanal") ?? "");
  const canalInputFromQuery = normalizeStringValue(
    params.get("searchCanalInput") ?? "",
  );

  const startFromStorage = parseDateFilterValue(persisted.pendingStartDate);
  const endFromStorage = parseDateFilterValue(persisted.pendingEndDate);
  const flagFromStorage = parseFlagServicioFilterValue(
    persisted.selectedFlagServicio,
  );
  const condicionFromStorage = parseCondicionFilterValue(
    persisted.selectedCondicion,
  );
  const fechaViajeFromStorage = parseBooleanFilterValue(
    persisted.searchByFechaViaje,
  );
  const modeFromStorage = parseSearchModeValue(persisted.searchMode);
  const numberFromStorage = normalizeStringValue(persisted.searchNumber ?? "");
  const canalFromStorage = normalizeStringValue(persisted.searchCanal ?? "");
  const canalInputFromStorage = normalizeStringValue(
    persisted.searchCanalInput ?? "",
  );

  const searchCanalInput =
    canalInputFromQuery ||
    canalFromQuery ||
    canalInputFromStorage ||
    canalFromStorage;

  return {
    pendingStartDate: startFromQuery ?? startFromStorage ?? today,
    pendingEndDate: endFromQuery ?? endFromStorage ?? today,
    selectedFlagServicio: flagFromQuery ?? flagFromStorage,
    selectedCondicion:
      condicionFromQuery ?? condicionFromStorage ?? CONDICION_OPTIONS[0].value,
    searchByFechaViaje: fechaViajeFromQuery ?? fechaViajeFromStorage ?? false,
    searchMode: modeFromQuery ?? modeFromStorage ?? "none",
    searchNumber: numberFromQuery || numberFromStorage,
    searchCanal: canalFromQuery || canalFromStorage || null,
    searchCanalInput,
  };
};

type TransactionRowForm = {
  id: number;
  date: string;
  paymentMethod: string;
  currency: string;
  exchangeRate: string;
  amount: string;
  bankName: string;
  operationCode: string;
  status?: string;
  persisted?: boolean;
};

const normalizeLegacyCurrencyToUi = (value?: string) => {
  const currency = normalizeStringValue(value).toUpperCase();
  if (currency === "SOL" || currency === "SOLES") return "SOLES";
  if (currency === "DOL" || currency === "DOLAR" || currency === "DOLARES")
    return "DOLARES";
  return currency || "SOLES";
};

const parseLegacyDecimalString = (value?: string, decimals = 2) =>
  parseMoneyValue(value).toFixed(decimals);

const parseLiquidacionNotaPayload = (
  payload: string | null | undefined,
): TransactionRowForm[] => {
  const raw = String(payload ?? "").trim();
  if (!raw || raw === "~") return [];

  let normalizedRaw = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") {
      normalizedRaw = parsed;
    }
  } catch {
    // respuesta no JSON, continuar con texto plano
  }

  const rows = normalizedRaw
    .replace(/~/g, LEGACY_ROW_SEPARATOR)
    .split(LEGACY_ROW_SEPARATOR)
    .map((row) => row.trim())
    .filter((row) => row && row !== "~");

  const bankMethods = [
    "DEPOSITO",
    "YAPE",
    "TARJETA",
    "TRANSFERENCIA",
    "CHEQUE",
  ];

  return rows
    .map((row, index) => {
      const fields = row.split("|");
      const liquidaId = Number(normalizeStringValue(fields[0])) || index + 1;
      const recibido = normalizeStringValue(fields[1]);
      const formaPago = normalizeStringValue(fields[2]).toUpperCase() || "-";
      const moneda = normalizeLegacyCurrencyToUi(fields[3]);
      const tipoCambio = parseLegacyDecimalString(fields[4], 3);
      const importe = parseLegacyDecimalString(fields[5], 2);
      const entidadBancaria = normalizeStringValue(fields[6]);
      const nroOperacion = normalizeStringValue(fields[7]);
      const estado = normalizeStringValue(fields[9]).toUpperCase();

      if (estado === "A") return null;

      const requiresBankData = bankMethods.includes(formaPago);
      return {
        id: liquidaId,
        date: recibido,
        paymentMethod: formaPago,
        currency: moneda,
        exchangeRate: tipoCambio,
        amount: importe,
        bankName: requiresBankData ? entidadBancaria : "-",
        operationCode: requiresBankData ? nroOperacion : "",
        status: estado || "P",
        persisted: true,
      } as TransactionRowForm;
    })
    .filter((row): row is TransactionRowForm => Boolean(row));
};

const LIQUIDACION_FIELDS = [
  { key: "notaId", label: "NotaId", sourceIndex: 0 },
  { key: "serieNumero", label: "Serie-Numero", sourceIndex: 1 },
  { key: "puntoPartida", label: "PuntoPartida", sourceIndex: 2 },
  { key: "productoNombre", label: "ProductoNombre", sourceIndex: 3 },
  { key: "fechaViaje", label: "FechaViaje", sourceIndex: 4 },
  { key: "fechaRegistro", label: "FechaRegistro", sourceIndex: 5 },
  { key: "horaPartida", label: "HoraPartida", sourceIndex: 6 },
  { key: "clienteNombre", label: "ClienteNombre", sourceIndex: 7 },
  { key: "clienteTelefono", label: "ClienteTelefono", sourceIndex: 8 },
  { key: "notaUsuario", label: "NotaUsuario", sourceIndex: 9 },
  { key: "cantidadPax", label: "CantidadPax", sourceIndex: 10 },
  { key: "islas", label: "Islas", sourceIndex: 11 },
  { key: "tubulares", label: "Tubulares", sourceIndex: 12 },
  { key: "otros", label: "Otros", sourceIndex: 13 },
  {
    key: "fullPunto",
    label: "PuntoPartida + Hotel + OtrasPartidas",
    sourceIndex: 14,
  },
  { key: "condicion", label: "Condicion", sourceIndex: 15 },
  { key: "formaPago", label: "FormaPago", sourceIndex: 16 },
  { key: "totalPagar", label: "TotalPagar", sourceIndex: 17 },
  { key: "acuenta", label: "Acuenta", sourceIndex: 18 },
  { key: "saldo", label: "Saldo", sourceIndex: 19 },
  { key: "auxiliar", label: "Auxiliar", sourceIndex: 20 },
  { key: "observaciones", label: "Observaciones", sourceIndex: 21 },
  { key: "ganancia", label: "Ganancia", sourceIndex: 22 },
  { key: "subtotal", label: "Subtotal", sourceIndex: 23 },
  { key: "igv", label: "IGV", sourceIndex: 24 },
  { key: "adicional", label: "Adicional", sourceIndex: 25 },
  { key: "estado", label: "Estado", sourceIndex: 26 },
  { key: "modificadoPor", label: "ModificadoPor", sourceIndex: 27 },
  { key: "fechaEdita", label: "FechaEdita", sourceIndex: 28 },
  { key: "serie", label: "Serie", sourceIndex: 29 },
  { key: "numero", label: "Numero", sourceIndex: 30 },
  { key: "efectivo", label: "Efectivo", sourceIndex: 31 },
  { key: "deposito", label: "Deposito", sourceIndex: 32 },
  { key: "entidadBancaria", label: "EntidadBancaria", sourceIndex: 33 },
  { key: "nroOperacion", label: "NroOperacion", sourceIndex: 34 },
  { key: "telefonoAuxiliar", label: "TelefonoAuxiliar", sourceIndex: 35 },
  { key: "visitasExCur", label: "VisitasExCur", sourceIndex: 36 },
  { key: "cobroExtraSol", label: "CobroExtraSol", sourceIndex: 37 },
  { key: "cobroExtraDol", label: "CobroExtraDol", sourceIndex: 38 },
  { key: "fechaAdelanto", label: "FechaAdelanto", sourceIndex: 39 },
  { key: "otrasPartidas", label: "OtrasPartidas", sourceIndex: 40 },
  { key: "incluyeIgv", label: "IncluyeIGV", sourceIndex: 41 },
  { key: "incluyeCargos", label: "IncluyeCargos", sourceIndex: 42 },
  { key: "moneda", label: "Moneda", sourceIndex: 43 },
  { key: "incluyeAlmuerzo", label: "IncluyeAlmuerzo", sourceIndex: 44 },
  { key: "notaImagen", label: "NotaImagen", sourceIndex: 45 },
  { key: "clienteDni", label: "ClienteDNI", sourceIndex: 46 },
  { key: "notaDocu", label: "NotaDocu", sourceIndex: 47 },
  { key: "hotel", label: "Hotel", sourceIndex: 48 },
  { key: "regionProducto", label: "RegionProducto", sourceIndex: 49 },
  { key: "regionNota", label: "RegionNota", sourceIndex: 50 },
  { key: "flagServicio", label: "FlagServicio", sourceIndex: 51 },
  { key: "flagVerificado", label: "FlagVerificado", sourceIndex: 52 },
] as const;

type LiquidacionFieldDefinition = (typeof LIQUIDACION_FIELDS)[number];
type LiquidacionFieldKey = LiquidacionFieldDefinition["key"];
type LiquidacionRow = Record<LiquidacionFieldKey, string> & {
  id: string;
  clienteId?: string;
  companiaId?: string;
  CompaniaId?: string;
};

const EXPECTED_FIELDS =
  Math.max(...LIQUIDACION_FIELDS.map((field) => field.sourceIndex)) + 1;
const LEGACY_EXPECTED_FIELDS = EXPECTED_FIELDS + 1;
const LEGACY_CLIENTE_ID_INDEX = 6;

const parseLiquidacionRow = (
  rowText: string,
  index: number,
): LiquidacionRow => {
  const rawValues = rowText.split("|");
  const normalizeToExpectedLength = (
    values: string[],
    expectedLength: number,
  ) =>
    values.length > expectedLength
      ? values
          .slice(0, expectedLength - 1)
          .concat(values.slice(expectedLength - 1).join("|"))
      : values;

  const looksLikeLegacyPayload = rawValues.length >= LEGACY_EXPECTED_FIELDS;
  const valuesByFormat = normalizeToExpectedLength(
    rawValues,
    looksLikeLegacyPayload ? LEGACY_EXPECTED_FIELDS : EXPECTED_FIELDS,
  );
  const legacyClienteId = looksLikeLegacyPayload
    ? normalizeStringValue(valuesByFormat[LEGACY_CLIENTE_ID_INDEX] ?? "")
    : "";
  const normalizedValues = looksLikeLegacyPayload
    ? valuesByFormat.filter(
        (_, valueIndex) => valueIndex !== LEGACY_CLIENTE_ID_INDEX,
      )
    : valuesByFormat;

  const rowRecord = LIQUIDACION_FIELDS.reduce(
    (acc, field) => {
      const value = normalizedValues[field.sourceIndex] ?? "";
      acc[field.key] = normalizeStringValue(value);
      return acc;
    },
    {} as Record<LiquidacionFieldKey, string>,
  );

  return {
    ...rowRecord,
    clienteId: legacyClienteId,
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
  const initialFiltersRef = useRef<InitialLiquidacionesFilters | null>(null);
  if (!initialFiltersRef.current) {
    initialFiltersRef.current = resolveInitialLiquidacionesFilters(
      location.search,
      todayValue,
    );
  }

  const [pendingStartDate, setPendingStartDate] = useState(
    initialFiltersRef.current.pendingStartDate,
  );
  const [pendingEndDate, setPendingEndDate] = useState(
    initialFiltersRef.current.pendingEndDate,
  );
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
  >(initialFiltersRef.current.selectedFlagServicio);
  const [tablePagination, setTablePagination] = useState<PaginationState>(() =>
    readPersistedLiquidacionesPagination(),
  );
  const [selectedCondicion, setSelectedCondicion] =
    useState<CondicionFilterValue>(initialFiltersRef.current.selectedCondicion);
  const [searchByFechaViaje, setSearchByFechaViaje] = useState(
    initialFiltersRef.current.searchByFechaViaje,
  );
  const [searchMode, setSearchMode] = useState<SearchMode>(
    initialFiltersRef.current.searchMode,
  );
  const [searchNumber, setSearchNumber] = useState(
    initialFiltersRef.current.searchNumber,
  );
  const [searchCanal, setSearchCanal] = useState<CanalRecordLike | null>(
    initialFiltersRef.current.searchCanal,
  );
  const [searchCanalInput, setSearchCanalInput] = useState(
    initialFiltersRef.current.searchCanalInput,
  );
  const [canalOptions, setCanalOptions] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<LiquidacionRow[] | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const lastReloadRangeRef = useRef<{ start: string; end: string } | null>(
    null,
  );
  const endDateAcceptedRef = useRef(false);
  const liquidacionTotals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const currency = normalizeCurrencyForTotals(row.moneda);
        const efectivo = parseMoneyValue(row.efectivo);
        const depTarYa = parseMoneyValue(row.deposito);

        if (currency === "DOLARES") {
          acc.efectivoDolares += efectivo;
          acc.depTarYaDolares += depTarYa;
        } else if (currency === "SOLES") {
          acc.efectivoSoles += efectivo;
          acc.depTarYaSoles += depTarYa;
        }

        return acc;
      },
      {
        efectivoDolares: 0,
        depTarYaDolares: 0,
        efectivoSoles: 0,
        depTarYaSoles: 0,
      },
    );
  }, [rows]);
  const normalizeCanalRecordToLabel = useCallback((canal: CanalRecordLike) => {
    if (typeof canal === "string") return normalizeStringValue(canal);

    const priorityValue =
      canal.nombre ??
      canal.auxiliar ??
      canal.canal ??
      canal.descripcion ??
      canal.label ??
      canal.value;

    const normalizedPriority = normalizeStringValue(
      typeof priorityValue === "string" ? priorityValue : "",
    );
    if (normalizedPriority) return normalizedPriority;

    for (const [key, value] of Object.entries(canal)) {
      if (key === "id" || key === "telefono") continue;
      if (typeof value !== "string") continue;
      const candidate = normalizeStringValue(value);
      if (candidate) return candidate;
    }

    return "";
  }, []);

  const getCanalOptionsFromDB = useCallback(async () => {
    const canales = await serviciosDB.canales.toArray();
    const normalizedCanales = Array.from(
      new Set(
        canales
          .map((canal) => normalizeCanalRecordToLabel(canal))
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));

    return normalizedCanales;
  }, [normalizeCanalRecordToLabel]);

  const ensureCanalOptionsLoaded = useCallback(async () => {
    let normalizedCanales = await getCanalOptionsFromDB();

    if (!normalizedCanales.length) {
      await loadServicios();
      normalizedCanales = await getCanalOptionsFromDB();
    }

    setCanalOptions(normalizedCanales);
    return normalizedCanales;
  }, [getCanalOptionsFromDB, loadServicios]);

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

  const stopCanalSearch = useCallback(() => {
    setSearchCanal(null);
    setSearchCanalInput("");
  }, []);

  const handleToggleSearchByNumero = (checked: boolean) => {
    if (checked) {
      setSearchMode("numero");
      stopCanalSearch();
      return;
    }
    setSearchMode("none");
    stopNumberSearch();
  };

  const handleToggleSearchByCanal = (checked: boolean) => {
    if (checked) {
      setSearchMode("canal");
      stopNumberSearch();
      void ensureCanalOptionsLoaded();
      return;
    }
    setSearchMode("none");
    stopCanalSearch();
  };
  const handleToggleSearchByFechaViaje = (checked: boolean) => {
    setSearchByFechaViaje(checked);
    reload(pendingStartDateRef.current, pendingEndDateRef.current, checked);
  };

  useEffect(() => {
    const persistedCanal =
      typeof searchCanal === "string"
        ? normalizeStringValue(searchCanal)
        : searchCanal
          ? normalizeCanalRecordToLabel(searchCanal)
          : "";

    writePersistedLiquidacionesFilters({
      pendingStartDate,
      pendingEndDate,
      selectedFlagServicio,
      selectedCondicion,
      searchByFechaViaje,
      searchMode,
      searchNumber: normalizeStringValue(searchNumber),
      searchCanal: persistedCanal || null,
      searchCanalInput: normalizeStringValue(searchCanalInput),
    });
  }, [
    pendingStartDate,
    pendingEndDate,
    selectedFlagServicio,
    selectedCondicion,
    searchByFechaViaje,
    searchMode,
    searchNumber,
    searchCanal,
    searchCanalInput,
    normalizeCanalRecordToLabel,
  ]);

  useEffect(() => {
    writePersistedLiquidacionesPagination(tablePagination);
  }, [tablePagination]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const resetPagination = () => {
      setTablePagination({
        pageIndex: 0,
        pageSize: LIQUIDACIONES_DEFAULT_PAGE_SIZE,
      });
    };

    window.addEventListener(
      LIQUIDACIONES_PAGINATION_RESET_EVENT,
      resetPagination,
    );

    return () => {
      window.removeEventListener(
        LIQUIDACIONES_PAGINATION_RESET_EVENT,
        resetPagination,
      );
    };
  }, []);

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

  const filterRowsByCondicion = useCallback(
    (sourceRows: LiquidacionRow[]) => {
      if (selectedCondicion === "TODOS") return sourceRows;

      return sourceRows.filter(
        (row) =>
          normalizeCondicionFilter(row.condicion) ===
          normalizeCondicionFilter(selectedCondicion),
      );
    },
    [selectedCondicion],
  );

  useEffect(() => {
    let sourceRows = allRows;

    if (searchMode === "numero") {
      const hasNumberQuery = Boolean(searchNumber.trim());
      sourceRows = hasNumberQuery ? (searchResults ?? []) : allRows;
    }

    if (searchMode === "canal") {
      const selectedCanalLabel =
        typeof searchCanal === "string"
          ? searchCanal
          : searchCanal
            ? normalizeCanalRecordToLabel(searchCanal)
            : "";
      const canalQuery = normalizeStringValue(
        searchCanalInput || selectedCanalLabel,
      ).toLowerCase();

      sourceRows = canalQuery
        ? allRows.filter((row) =>
            normalizeStringValue(row.auxiliar)
              .toLowerCase()
              .includes(canalQuery),
          )
        : allRows;
    }

    setRows(filterRowsByCondicion(filterRowsByFlagServicio(sourceRows)));
  }, [
    allRows,
    filterRowsByCondicion,
    filterRowsByFlagServicio,
    searchMode,
    searchNumber,
    searchResults,
    searchCanal,
    searchCanalInput,
    normalizeCanalRecordToLabel,
  ]);

  useEffect(() => {
    if (searchMode !== "numero") {
      searchAbortRef.current?.abort();
      searchAbortRef.current = null;
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
      setSearchLoading(false);
      setSearchError(null);
      setSearchResults(null);
      return;
    }

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
  }, [searchMode, searchNumber]);

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
        let normalizedCanales = await getCanalOptionsFromDB();

        // La DB puede estar parcialmente poblada (sin canales), forzamos sync y relectura.
        if (hasData && !normalizedCanales.length) {
          await loadServicios();
          normalizedCanales = await getCanalOptionsFromDB();
        }

        if (!canceled) {
          setProductos(stored);
          setCanalOptions(normalizedCanales);
        }
      } catch (err) {
        console.error("Error cargando productos", err);
      }
    };
    loadProductos();
    return () => {
      canceled = true;
    };
  }, [getCanalOptionsFromDB, loadServicios, loadServiciosFromDB]);
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
    productosCatalogo: Producto[],
  ) {
    const emptyServicio = {
      label: "-",
      value: "0",
      id: "0",
      descripcion: "",
    };

    const productosById = new Map(
      (productosCatalogo || []).map((producto) => [
        Number(producto.id),
        producto,
      ]),
    );
    const productosByName = new Map(
      (productosCatalogo || []).map((producto) => [
        normalizeProductName(producto.nombre),
        producto,
      ]),
    );
    const productosNormalized = (productosCatalogo || []).map((producto) => ({
      raw: producto,
      normalizedName: normalizeProductName(producto.nombre),
    }));

    const getDetalleProductId = (detalle: BackendDetalle) => {
      const rawId =
        detalle.idProducto ??
        detalle.idProductoDetalle ??
        detalle.IdProducto ??
        detalle.IdProductoDetalle ??
        0;
      const parsed = Number(rawId);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const buildServicioFromDetalle = (detalle: BackendDetalle) => {
      const actividadRaw = normalizeStringValue(detalle.actividades);
      if (!actividadRaw || actividadRaw === "-") return emptyServicio;

      const productId = getDetalleProductId(detalle);
      const matchedById =
        productId > 0 ? productosById.get(productId) : undefined;
      const matchedByName = productosByName.get(
        normalizeProductName(actividadRaw),
      );
      const normalizedActividad = normalizeProductName(actividadRaw);
      const matchedByContains = productosNormalized.find(
        (producto) =>
          producto.normalizedName &&
          (normalizedActividad.includes(producto.normalizedName) ||
            producto.normalizedName.includes(normalizedActividad)),
      )?.raw;
      const matched = matchedById ?? matchedByName ?? matchedByContains;

      if (matched) {
        return {
          label: matched.nombre,
          value: String(matched.id),
          id: String(matched.id),
          descripcion: "",
        };
      }

      return {
        label: actividadRaw,
        value: productId > 0 ? String(productId) : "0",
        id: productId > 0 ? String(productId) : "0",
        descripcion: "",
      };
    };

    // ===============================
    // BUILDERS
    // ===============================

    // 👉 TARIFA (legacy)
    const buildTarifaRow = (d: BackendDetalle) => {
      const actividadLabel = normalizeStringValue(d.actividades);
      return {
        detalleId: d.detalleId,
        servicio: {
          label: actividadLabel || "-",
          value: actividadLabel || "",
          id: actividadLabel || "",
          descripcion: "",
        },
        precio: d.precio ?? 0,
        cant: d.cantidad ?? 0,
        total: d.importe ?? 0,
      };
    };

    // 👉 ACTIVIDADES / TRASLADO (city tour nuevo formato usa productoId)
    const buildNormalRow = (d: BackendDetalle) => ({
      detalleId: d.detalleId,
      servicio: buildServicioFromDetalle(d),
      hora: d.hora ?? "",
      turno: d.turno ?? d.hora ?? "",
      precio: d.precio ?? 0,
      cant: d.cantidad ?? 0,
      total: d.importe ?? 0,
    });

    // 👉 ENTRADA (sin hora / turno)
    const buildEntradaRow = (d: BackendDetalle) => ({
      detalleId: d.detalleId,
      servicio: buildServicioFromDetalle(d),
      precio: d.precio ?? 0,
      cant: d.cantidad ?? 0,
      total: d.importe ?? 0,
    });

    // ===============================
    // ROWS VACÍAS
    // ===============================
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

    // ===============================
    // NORMALIZACIÓN POR POSICIÓN
    // Nuevo formato city tour: solo act1-act3
    // Legacy: tarifa, act1-act3, traslado, entrada
    // ===============================
    const isNewCityTourFormat = detalles.length > 0 && detalles.length <= 3;

    if (isNewCityTourFormat) {
      detalles.forEach((d, index) => {
        if (index >= 0 && index <= 2) {
          rows[`act${index + 1}` as "act1" | "act2" | "act3"] =
            buildNormalRow(d);
        }
      });
      return rows;
    }

    detalles.forEach((d, index) => {
      if (index === 0) {
        rows.tarifa = buildTarifaRow(d);
        return;
      }

      if (index >= 1 && index <= 3) {
        rows[`act${index}` as "act1" | "act2" | "act3"] = buildNormalRow(d);
        return;
      }

      if (index === 4) {
        rows.traslado = buildNormalRow(d);
        return;
      }

      if (index === 5) {
        rows.entrada = buildEntradaRow(d);
      }
    });

    return rows;
  }
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
      //await loadCanalDeVentas();
    } catch (error) {
      console.warn("No se pudieron cargar canales de venta", error);
    }
    const data = row;
    const [detalle /*, liquidacionesNotaRaw*/] = await Promise.all([
      fetchDetalleActividades(row.notaId),
      //fetchLiquidacionNota(row.notaId),
    ]);
    //const liquidacionesNota = parseLiquidacionNotaPayload(liquidacionesNotaRaw);
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
      precioExtraSoles: data.cobroExtraSol,
      precioExtraDolares: data.cobroExtraDol,
      observaciones: data.observaciones,
      detalle:
        row.flagServicio == "1"
          ? normalizeBackendDetalleToForm(detalle)
          : normalizeBackendDetalleToFormCityTour(detalle, productosLocal),
      detallexd:
        row.flagServicio == "1"
          ? normalizeBackendDetalleToForm(detalle)
          : normalizeBackendDetalleToFormCityTour(detalle, productosLocal),
      canalDeVenta,
      hotel: hotel ? { label: hotel?.nombre, value: Number(hotel?.id) } : null,
      puntoPartida: data.puntoPartida,
      nserie: data.serie,
      ndocumento: data.numero,
      clienteId: data.clienteId,
      notaImagen: data.notaImagen,
      // transactions: liquidacionesNota,
      _editMode: true,
      estado: data.estado,
      flagVerificado: data.flagVerificado,
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
  const isPagoVerificado = useCallback((row: LiquidacionRow) => {
    return normalizeStringValue(row.flagVerificado) === "1";
  }, []);
  const sessionRaw = localStorage.getItem("picaflor.auth.session");
  const sessionStore = sessionRaw ? JSON.parse(sessionRaw) : null;
  const columns = useMemo(() => {
    const cols = [];

    if (sessionStore.user.areaId === "6") {
      cols.push(
        columnHelper.display({
          id: "pVerificado",
          size: 110,
          header: "Verificado",
          cell: ({ row }) =>
            isPagoVerificado(row.original) ? (
              <Check
                className="mx-auto h-4 w-4 text-emerald-600"
                aria-label="Verificado"
              />
            ) : (
              <X
                className="mx-auto h-4 w-4 text-slate-400"
                aria-label="No verificado"
              />
            ),
        }),
      );
    }

    cols.push(
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
      }),

      columnHelper.accessor("productoNombre", {
        header: "Tours",
      }),

      columnHelper.accessor("fechaViaje", {
        header: "FechaViaje",
      }),

      columnHelper.accessor("fechaRegistro", {
        header: "Registro",
      }),

      columnHelper.accessor("horaPartida", {
        header: "Horapartida",
        meta: { align: "center" },
      }),

      columnHelper.accessor("auxiliar", {
        header: "Canal de venta",
      }),

      columnHelper.accessor("clienteNombre", {
        header: "Pasajero",
      }),

      columnHelper.accessor("clienteTelefono", {
        header: "Celular",
      }),

      columnHelper.accessor("notaUsuario", {
        header: "Counter",
      }),

      columnHelper.accessor("condicion", {
        header: "Condicion",
      }),
      columnHelper.accessor("cantidadPax", {
        meta: { align: "center" },
        header: "Cant.Pax",
      }),

      columnHelper.accessor("formaPago", {
        header: "Forma de pago",
      }),

      columnHelper.accessor("totalPagar", {
        header: "Total",
        meta: { align: "right" },
      }),

      columnHelper.accessor("acuenta", {
        header: "Acuenta",
        meta: { align: "right" },
      }),

      columnHelper.accessor("saldo", {
        header: "Saldo",
        meta: { align: "right" },
      }),

      columnHelper.accessor("estado", {
        header: "Estado",
      }),
    );

    return cols;
  }, [columnHelper, isPagoVerificado, navigate, sessionStore.user.areaId]);

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
    async (startDate?: string, endDate?: string, esViaje?: boolean) => {
      if (!user) {
        setError("Usuario no autenticado");
        return;
      }
      const areaId = Number(user.areaId ?? user.area ?? 0);
      const usuarioId = Number(user.id ?? 0);
      const rangeStart = startDate ?? pendingStartDateRef.current ?? todayValue;
      const rangeEnd = endDate ?? pendingEndDateRef.current ?? todayValue;
      lastReloadRangeRef.current = { start: rangeStart, end: rangeEnd };
      const useFechaViaje = esViaje ?? searchByFechaViaje;
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
          ...(useFechaViaje ? { esViaje: true } : {}),
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
    [searchByFechaViaje, todayValue, user],
  );

  const handleRangeSearch = () => {
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

  const SearchModeFilterInput = ({
    globalFilter,
    setGlobalFilter,
  }: {
    globalFilter: string;
    setGlobalFilter: (value: string) => void;
  }) => (
    <div className="w-full max-w-full space-y-2 sm:max-w-lg lg:max-w-xl">
      <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <ChevronLeft
            className="cursor-pointer"
            onClick={() => {
              navigate("/fullday");
            }}
          />
        </div>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={searchMode === "canal"}
            onChange={(e) => handleToggleSearchByCanal(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Canal de venta
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={searchMode === "numero"}
            onChange={(e) => handleToggleSearchByNumero(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Numero de pedido
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={searchByFechaViaje}
            onChange={(e) => handleToggleSearchByFechaViaje(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Fecha viaje
        </label>
      </div>

      {searchMode === "none" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar en toda la tabla..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-10 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {globalFilter && (
            <button
              type="button"
              onClick={() => setGlobalFilter("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {searchMode === "numero" && (
        <div className="space-y-1">
          <input
            type="text"
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            placeholder="Buscar por numero de pedido"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {searchLoading && (
            <span className="text-[0.7rem] text-slate-500">Buscando...</span>
          )}
          {searchError && (
            <span className="text-[0.7rem] text-red-600">{searchError}</span>
          )}
        </div>
      )}

      {searchMode === "canal" && (
        <div className="w-full">
          <Autocomplete
            size="small"
            options={canalVentaList}
            value={searchCanal}
            inputValue={searchCanalInput}
            onChange={(_, value) => setSearchCanal(value)}
            onInputChange={(_, value) => setSearchCanalInput(value)}
            noOptionsText="Sin canales"
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                placeholder="Selecciona canal de venta"
              />
            )}
          />
        </div>
      )}
    </div>
  );
  const handleExcelExport = () => {
    const exportableRows = rows.filter((row) => row.notaId !== "~");
    if (exportableRows.length === 0) {
      showToast({
        title: "No hay datos",
        description: "No hay datos para exportar.",
        type: "error",
      });
      return;
    }

    type ExportColumn = {
      key: string;
      label: string;
      width?: number;
      numeric?: boolean;
      money?: boolean;
      align?: "center" | "right";
      getValue: (row: LiquidacionRow) => unknown;
    };

    const exportColumns: ExportColumn[] = [];
    if (sessionStore?.user?.areaId === "6") {
      exportColumns.push({
        key: "pVerificado",
        label: "Verificado",
        width: 14,
        align: "center",
        getValue: (row) => (isPagoVerificado(row) ? "SI" : "NO"),
      });
    }

    exportColumns.push(
      {
        key: "notaId",
        label: "Numero",
        width: 12,
        align: "right",
        getValue: (row) => row.notaId,
      },
      {
        key: "productoNombre",
        label: "Tours",
        width: 28,
        getValue: (row) => row.productoNombre,
      },
      {
        key: "fechaViaje",
        label: "FechaViaje",
        width: 14,
        getValue: (row) => row.fechaViaje,
      },
      {
        key: "fechaRegistro",
        label: "Registro",
        width: 14,
        getValue: (row) => row.fechaRegistro,
      },
      {
        key: "horaPartida",
        label: "Horapartida",
        width: 12,
        align: "center",
        getValue: (row) => row.horaPartida,
      },
      {
        key: "auxiliar",
        label: "Canal de venta",
        width: 22,
        getValue: (row) => row.auxiliar,
      },
      {
        key: "clienteNombre",
        label: "Pasajero",
        width: 28,
        getValue: (row) => row.clienteNombre,
      },
      {
        key: "clienteTelefono",
        label: "Celular",
        width: 14,
        getValue: (row) => row.clienteTelefono,
      },
      {
        key: "notaUsuario",
        label: "Counter",
        width: 18,
        getValue: (row) => row.notaUsuario,
      },
      {
        key: "condicion",
        label: "Condicion",
        width: 14,
        getValue: (row) => row.condicion,
      },
      {
        key: "cantidadPax",
        label: "Cant.Pax",
        width: 10,
        numeric: true,
        align: "center",
        getValue: (row) => row.cantidadPax,
      },
      {
        key: "moneda",
        label: "Moneda",
        width: 12,
        getValue: (row) => row.moneda,
      },
      {
        key: "formaPago",
        label: "Forma de pago",
        width: 18,
        getValue: (row) => row.formaPago,
      },
      {
        key: "nroOperacion",
        label: "NumeroOperacion",
        width: 18,
        getValue: (row) => row.nroOperacion,
      },
      {
        key: "totalPagar",
        label: "Total",
        width: 12,
        numeric: true,
        money: true,
        align: "right",
        getValue: (row) => row.totalPagar,
      },
      {
        key: "acuenta",
        label: "Acuenta",
        width: 12,
        numeric: true,
        money: true,
        align: "right",
        getValue: (row) => row.acuenta,
      },
      {
        key: "saldo",
        label: "Saldo",
        width: 12,
        numeric: true,
        money: true,
        align: "right",
        getValue: (row) => row.saldo,
      },
      {
        key: "efectivo",
        label: "Efectivo",
        width: 12,
        numeric: true,
        money: true,
        align: "right",
        getValue: (row) => row.efectivo,
      },
      {
        key: "deposito",
        label: "Deposito",
        width: 12,
        numeric: true,
        money: true,
        align: "right",
        getValue: (row) => row.deposito,
      },
      {
        key: "estado",
        label: "Estado",
        width: 14,
        getValue: (row) => row.estado,
      },
    );

    const data = exportableRows.map((row) => {
      const rowData: Record<string, string | number> = {};
      exportColumns.forEach((column) => {
        const rawValue = column.getValue(row);
        if (column.numeric) {
          rowData[column.label] = parseMoneyValue(
            normalizeStringValue(String(rawValue ?? "")),
          );
        } else {
          rowData[column.label] = toPlainText(rawValue);
        }
      });
      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(data, {
      origin: "A2",
      skipHeader: true,
    });

    exportColumns.forEach((column, index) => {
      const ref = XLSX.utils.encode_cell({ r: 0, c: index });
      ws[ref] = {
        t: "s",
        v: column.label,
        s: {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          fill: { fgColor: { rgb: "3377FF" } },
          border: {
            top: { style: "thin", color: { rgb: "475569" } },
            bottom: { style: "thin", color: { rgb: "475569" } },
            left: { style: "thin", color: { rgb: "475569" } },
            right: { style: "thin", color: { rgb: "475569" } },
          },
        },
      };
    });

    const centerAlignedCols = exportColumns
      .map((column, index) => (column.align === "center" ? index : null))
      .filter((index) => index !== null) as number[];
    const rightAlignedCols = exportColumns
      .map((column, index) => (column.align === "right" ? index : null))
      .filter((index) => index !== null) as number[];
    const numericCols = exportColumns
      .map((column, index) => (column.numeric ? index : null))
      .filter((index) => index !== null) as number[];
    const moneyCols = exportColumns
      .map((column, index) => (column.money ? index : null))
      .filter((index) => index !== null) as number[];

    const lastCol = XLSX.utils.encode_col(exportColumns.length - 1);
    const lastRow = data.length + 1;

    ws["!autofilter"] = {
      ref: `A1:${lastCol}${lastRow}`,
    };

    ws["!cols"] = exportColumns.map((column) => ({
      wch: column.width ?? 18,
    }));

    const range = XLSX.utils.decode_range(ws["!ref"] ?? `A1:${lastCol}1`);
    for (let r = 1; r <= range.e.r; r++) {
      const isEven = (r - 1) % 2 === 0;

      for (let c = 0; c <= range.e.c; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!ws[ref]) continue;

        if (numericCols.includes(c)) {
          ws[ref].t = "n";
          ws[ref].v = Number(ws[ref].v) || 0;
          if (moneyCols.includes(c)) {
            ws[ref].z = "0.00";
          }
        }

        ws[ref].s = {
          ...(ws[ref].s || {}),
          alignment: centerAlignedCols.includes(c)
            ? { horizontal: "center", vertical: "center" }
            : rightAlignedCols.includes(c)
              ? { horizontal: "right", vertical: "center" }
              : { horizontal: "left", vertical: "center" },
          fill: {
            fgColor: { rgb: isEven ? "F8FAFC" : "FFFFFF" },
          },
          border: {
            top: { style: "thin", color: { rgb: "E5E7EB" } },
            bottom: { style: "thin", color: { rgb: "E5E7EB" } },
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } },
          },
        };
      }
    }

    ws["!freeze"] = { ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Liquidaciones");

    const fileStart = pendingStartDateRef.current || todayValue;
    const fileEnd = pendingEndDateRef.current || todayValue;
    const fileDatePart =
      fileStart === fileEnd ? fileStart : `${fileStart}_a_${fileEnd}`;

    XLSX.writeFile(wb, `liquidaciones-${fileDatePart}.xlsx`);
  };

  const DateRangeFilter = () => (
    <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        {/* FECHA INICIO */}
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          <label className="font-medium text-slate-600">Fecha Inicio</label>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              format="DD/MM/YY"
              value={pendingStartDate ? dayjs(pendingStartDate) : null}
              onChange={(value) => {
                const nextValue = value?.format("YYYY-MM-DD") ?? "";
                setPendingStartDate(nextValue);
              }}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    width: { xs: "100%", sm: 170 },
                    "& .MuiOutlinedInput-root": {
                      height: 40,
                      borderRadius: "0.5rem",
                      backgroundColor: "#f8fafc",
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
        </div>

        {/* FECHA FIN */}
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          <label className="font-medium text-slate-600">Fecha Fin</label>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              format="DD/MM/YY"
              value={pendingEndDate ? dayjs(pendingEndDate) : null}
              onChange={(value) => {
                const nextValue = value?.format("YYYY-MM-DD") ?? "";
                setPendingEndDate(nextValue);
              }}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    width: { xs: "100%", sm: 170 },
                    "& .MuiOutlinedInput-root": {
                      height: 40,
                      borderRadius: "0.5rem",
                      backgroundColor: "#f8fafc",
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
        </div>

        {/* SERVICIO */}
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          <label className="font-medium text-slate-600">Servicio</label>
          <select
            value={selectedFlagServicio ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedFlagServicio(value ? Number(value) : null);
            }}
            className="h-10 w-full sm:w-44 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">Todas</option>
            {FLAG_SERVICIO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* CONDICIÓN */}
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          <label className="font-medium text-slate-600">Condición</label>
          <select
            value={selectedCondicion}
            onChange={(e) =>
              setSelectedCondicion(e.target.value as CondicionFilterValue)
            }
            className="h-10 w-full sm:w-44 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {CONDICION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* BOTONES */}
        <div className="flex gap-3 lg:ml-auto">
          {/* BUSCAR */}
          <button
            type="button"
            onClick={handleRangeSearch}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60 transition"
          >
            <Search size={16} />
            Buscar
          </button>

          <button
            type="button"
            onClick={() => {
              handleExcelExport();
            }}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
        </div>
      </div>
    </div>
  );
  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DndTable
        data={rows}
        columns={columns}
        paginationState={tablePagination}
        onPaginationStateChange={setTablePagination}
        autoResetPageIndex={false}
        pageSizeOptions={[...LIQUIDACIONES_PAGE_SIZE_OPTIONS]}
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
        searchInputComponent={SearchModeFilterInput}
        isLoading={loading}
        emptyMessage="No se encontraron liquidaciones"
        dateFilterComponent={DateRangeFilter}
        enableRowSelection={false}
        enableCellNavigation={true}
        paginationBottomContent={
          <div className="px-4 sm:px-6 py-3 bg-slate-50/60">
            <div className="overflow-x-auto">
              <table className="ml-auto min-w-[680px] text-right text-xs sm:text-sm">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="px-4 py-2 align-top">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Dolares - Efectivo
                      </div>
                      <div className="font-medium text-slate-800">
                        {formatTotalsAmount(liquidacionTotals.efectivoDolares)}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top border-l border-slate-200">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Dolares - Dep/Tar/Yape
                      </div>
                      <div className="font-medium text-slate-800">
                        {formatTotalsAmount(liquidacionTotals.depTarYaDolares)}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top border-l border-slate-200">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Dolares - Total
                      </div>
                      <div className="font-semibold text-slate-900">
                        {formatTotalsAmount(
                          liquidacionTotals.efectivoDolares +
                            liquidacionTotals.depTarYaDolares,
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 align-top">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Soles - Efectivo
                      </div>
                      <div className="font-medium text-slate-800">
                        {formatTotalsAmount(liquidacionTotals.efectivoSoles)}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top border-l border-slate-200">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Soles - Dep/Tar/Yape
                      </div>
                      <div className="font-medium text-slate-800">
                        {formatTotalsAmount(liquidacionTotals.depTarYaSoles)}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top border-l border-slate-200">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Soles - Total
                      </div>
                      <div className="font-semibold text-slate-900">
                        {formatTotalsAmount(
                          liquidacionTotals.efectivoSoles +
                            liquidacionTotals.depTarYaSoles,
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        }
        rowColorRules={[
          {
            when: (row) =>
              String(row.estado ?? "")
                .trim()
                .toUpperCase() === "ANULADO",
            className: "bg-red-50 text-red-700",
          },
          {
            when: (row) =>
              String(row.estado ?? "")
                .trim()
                .toUpperCase() !== "ANULADO" && row.condicion === "CREDITO",
            className: "bg-orange-200 text-orange-700",
          },

          {
            when: (row) =>
              String(row.estado ?? "")
                .trim()
                .toUpperCase() !== "ANULADO" && row.estado === "PENDIENTE",
            className: "bg-yellow-50 text-yellow-800",
          },
          {
            when: (row) =>
              String(row.estado ?? "")
                .trim()
                .toUpperCase() !== "ANULADO" && row.estado === "CANCELADO",
            className: "bg-white text-slate-900",
          },
        ]}
      />
    </div>
  );
};

export default LiquidacionesPage;
