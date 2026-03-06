import * as XLSX from "xlsx-js-style";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createColumnHelper,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { esES } from "@mui/x-date-pickers/locales";
import { useLocation, useNavigate } from "react-router";
import { Check, ChevronLeft, FileSpreadsheet, Plus, Search, X } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";

import DndTable from "@/components/dataTabla/DndTable";
import { showToast } from "@/components/ui/AppToast";
import { normalizeLegacyXmlPayload } from "@/shared/helpers/normalizeLegacyXmlPayload";
import { useAuthStore } from "@/store/auth/auth.store";
import { listarPaqueteViaje } from "../api/travelPackageApi";

type TravelPackageListadoRow = {
  id: string;
  idPaqueteViaje: number;
  fechaEmision: string;
  programa: string;
  fechaInicioViaje: string;
  fechaFinViaje: string;
  agenciaCodigo: string;
  agenciaNombre: string;
  counterNombre: string;
  contacto: string;
  telefono: string;
  email: string;
  condicionPago: string;
  moneda: string;
  totalGeneral: number;
  acuenta: number;
  saldo: number;
  estado: string;
  activo: string;
  fechaRegistro: string;
  primerPasajero: string;
  pasaportePrimerPasajero: string;
  nacionalidadPrimerPasajero: string;
  telefonoPrimerPasajero: string;
  fechaNacimientoPrimerPasajero: string;
  flagVerificado: "0" | "1";
};

const CONDICION_OPTIONS = [
  { label: "TODOS", value: "TODOS" },
  { label: "ACUENTA", value: "ACUENTA" },
  { label: "CANCELADO", value: "CANCELADO" },
  { label: "CREDITO", value: "CREDITO" },
] as const;

const ESTADO_OPTIONS = [
  { label: "TODOS", value: "TODOS" },
  { label: "PENDIENTE", value: "PENDIENTE" },
  { label: "CANCELADO", value: "CANCELADO" },
  { label: "ANULADO", value: "ANULADO" },
] as const;

type CondicionFilterValue = (typeof CONDICION_OPTIONS)[number]["value"];
type EstadoFilterValue = (typeof ESTADO_OPTIONS)[number]["value"];
type SearchMode = "none" | "numero" | "agencia";

const getTodayIso = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

const parseMoneyLike = (value: string) => {
  const normalized = String(value ?? "")
    .replace(/,/g, "")
    .trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCell = (value: unknown) =>
  normalizeLegacyXmlPayload(String(value ?? "")).trim();
const normalizeStringValue = (value: unknown) => String(value ?? "").trim();
const normalizeFilterValue = (value: unknown) =>
  normalizeStringValue(value).toUpperCase().replace(/\s+/g, "");

const normalizeCurrencyForTotals = (value: unknown) => {
  const currency = normalizeFilterValue(value);
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
  return currency;
};

const formatTotalsAmount = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const normalizeLegacyDateForFilter = (value: unknown) => {
  const raw = normalizeStringValue(value);
  if (!raw) return "";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month}-${day}`;
  }

  const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month}-${day}`;
  }

  return "";
};

const parseRow = (
  rawRow: string,
  index: number,
): TravelPackageListadoRow | null => {
  const rowText = normalizeLegacyXmlPayload(rawRow).trim();
  if (!rowText || rowText === "~") return null;

  const cols = rowText.split("|").map((item) => normalizeCell(item));
  const idPaqueteViaje = Number(cols[0] ?? 0);

  return {
    id:
      Number.isFinite(idPaqueteViaje) && idPaqueteViaje > 0
        ? String(idPaqueteViaje)
        : `tmp-${index + 1}`,
    idPaqueteViaje:
      Number.isFinite(idPaqueteViaje) && idPaqueteViaje > 0
        ? idPaqueteViaje
        : 0,
    fechaEmision: cols[1] ?? "",
    programa: cols[2] ?? "",
    fechaInicioViaje: cols[3] ?? "",
    fechaFinViaje: cols[4] ?? "",
    agenciaCodigo: cols[5] ?? "",
    agenciaNombre: cols[6] ?? "",
    counterNombre: cols[7] ?? "",
    contacto: cols[8] ?? "",
    telefono: cols[9] ?? "",
    email: cols[10] ?? "",
    condicionPago: cols[11] ?? "",
    moneda: cols[12] ?? "",
    totalGeneral: parseMoneyLike(cols[13] ?? ""),
    acuenta: parseMoneyLike(cols[14] ?? ""),
    saldo: parseMoneyLike(cols[15] ?? ""),
    estado: cols[16] ?? "",
    activo: cols[17] ?? "",
    fechaRegistro: cols[18] ?? "",
    primerPasajero: cols[19] ?? "",
    pasaportePrimerPasajero: cols[20] ?? "",
    nacionalidadPrimerPasajero: cols[21] ?? "",
    telefonoPrimerPasajero: cols[22] ?? "",
    fechaNacimientoPrimerPasajero: cols[23] ?? "",
    flagVerificado: String(cols[24] ?? "0").trim() === "1" ? "1" : "0",
  };
};

const parseListadoResponse = (raw: unknown): TravelPackageListadoRow[] => {
  if (!raw) return [];

  const pushParsedRows = (
    payload: string,
    target: TravelPackageListadoRow[],
  ) => {
    const rows = normalizeLegacyXmlPayload(payload)
      .split("¬")
      .map((item) => item.trim())
      .filter(Boolean);

    rows.forEach((item, rowIndex) => {
      const parsed = parseRow(item, target.length + rowIndex);
      if (parsed) target.push(parsed);
    });
  };

  const parsedRows: TravelPackageListadoRow[] = [];

  if (typeof raw === "string") {
    pushParsedRows(raw, parsedRows);
    return parsedRows;
  }

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (typeof item === "string") {
        pushParsedRows(item, parsedRows);
        return;
      }
      if (item && typeof item === "object") {
        const objectItem = item as Record<string, unknown>;
        const payload = normalizeCell(
          objectItem.Resultado ?? objectItem.resultado ?? objectItem.data ?? "",
        );
        if (payload) pushParsedRows(payload, parsedRows);
      }
    });
    return parsedRows;
  }

  if (typeof raw === "object") {
    const objectRaw = raw as Record<string, unknown>;
    const payload = normalizeCell(
      objectRaw.Resultado ?? objectRaw.resultado ?? objectRaw.data ?? "",
    );
    if (payload) pushParsedRows(payload, parsedRows);
  }

  return parsedRows;
};

const toDdMmYyyy = (value: string) => {
  const parts = String(value ?? "").split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const TRAVEL_PACKAGE_LIST_DATA_CACHE_STORAGE_KEY =
  "travel-package:list:data-cache:v1";
const TRAVEL_PACKAGE_LIST_STALE_STORAGE_KEY = "travel-package:list:stale:v1";
const TRAVEL_PACKAGE_LIST_MANUAL_REFRESH_EVENT =
  "picaflor:travel-package:list:manual-refresh";
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type PersistedTravelPackageDataCache = {
  rows: TravelPackageListadoRow[];
  startDate: string;
  endDate: string;
  searchByFechaViaje: boolean;
  areaId: number;
  usuarioId: number;
};

const parseDateCacheValue = (value: unknown): string | null => {
  const normalized = normalizeStringValue(value);
  return DATE_INPUT_PATTERN.test(normalized) ? normalized : null;
};

const parseBooleanCacheValue = (value: unknown): boolean | null => {
  const normalized = normalizeStringValue(value).toLowerCase();
  if (!normalized) return null;
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return null;
};

const parsePositiveIntegerCacheValue = (value: unknown): number | null => {
  const normalized = normalizeStringValue(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
};

const readPersistedTravelPackageDataCache =
  (): PersistedTravelPackageDataCache | null => {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.sessionStorage.getItem(
        TRAVEL_PACKAGE_LIST_DATA_CACHE_STORAGE_KEY,
      );
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<PersistedTravelPackageDataCache>;
      const rows = Array.isArray(parsed?.rows)
        ? (parsed.rows as TravelPackageListadoRow[])
        : null;
      const startDate = parseDateCacheValue(parsed?.startDate);
      const endDate = parseDateCacheValue(parsed?.endDate);
      const searchByFechaViaje = parseBooleanCacheValue(
        parsed?.searchByFechaViaje,
      );
      const areaId = parsePositiveIntegerCacheValue(parsed?.areaId);
      const usuarioId = parsePositiveIntegerCacheValue(parsed?.usuarioId);

      if (
        !rows ||
        !startDate ||
        !endDate ||
        searchByFechaViaje === null ||
        !areaId ||
        !usuarioId
      ) {
        return null;
      }

      return {
        rows,
        startDate,
        endDate,
        searchByFechaViaje,
        areaId,
        usuarioId,
      };
    } catch {
      return null;
    }
  };

const writePersistedTravelPackageDataCache = (
  dataCache: PersistedTravelPackageDataCache,
) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      TRAVEL_PACKAGE_LIST_DATA_CACHE_STORAGE_KEY,
      JSON.stringify(dataCache),
    );
  } catch {
    // ignorar errores de almacenamiento para no afectar la pantalla
  }
};

const hasPersistedTravelPackageStaleFlag = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const raw = window.sessionStorage.getItem(
      TRAVEL_PACKAGE_LIST_STALE_STORAGE_KEY,
    );
    return raw === "1" || raw === "true";
  } catch {
    return false;
  }
};

const clearPersistedTravelPackageStaleFlag = () => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(TRAVEL_PACKAGE_LIST_STALE_STORAGE_KEY);
  } catch {
    // ignorar errores de almacenamiento para no afectar la pantalla
  }
};

const TravelPackageList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const refreshKey =
    location.state && typeof location.state === "object"
      ? (location.state as { refresh?: unknown }).refresh
      : undefined;
  const authUser = useAuthStore((state) => state.user);
  const todayValue = useMemo(() => getTodayIso(), []);
  const [pendingStartDate, setPendingStartDate] = useState(todayValue);
  const [pendingEndDate, setPendingEndDate] = useState(todayValue);
  const [appliedStartDate, setAppliedStartDate] = useState(todayValue);
  const [appliedEndDate, setAppliedEndDate] = useState(todayValue);
  const [selectedCondicion, setSelectedCondicion] =
    useState<CondicionFilterValue>("TODOS");
  const [selectedEstado, setSelectedEstado] =
    useState<EstadoFilterValue>("TODOS");
  const [searchMode, setSearchMode] = useState<SearchMode>("none");
  const [searchNumber, setSearchNumber] = useState("");
  const [searchAgency, setSearchAgency] = useState("");
  const [searchByFechaViaje, setSearchByFechaViaje] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allRows, setAllRows] = useState<TravelPackageListadoRow[]>([]);
  const [rows, setRows] = useState<TravelPackageListadoRow[]>([]);
  const [filteredRowsForTotals, setFilteredRowsForTotals] = useState<
    TravelPackageListadoRow[]
  >([]);
  const [tablePagination, setTablePagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const pendingStartDateRef = useRef(pendingStartDate);
  const pendingEndDateRef = useRef(pendingEndDate);
  const initialLoadRef = useRef(false);
  const handledRefreshKeyRef = useRef<unknown>(undefined);
  const lastReloadRangeRef = useRef<{ start: string; end: string } | null>(
    null,
  );
  const endDateAcceptedRef = useRef(false);
  const columnHelper = createColumnHelper<TravelPackageListadoRow>();
  const isPagoVerificado = useCallback((row: TravelPackageListadoRow) => {
    return normalizeStringValue(row.flagVerificado) === "1";
  }, []);
  const sessionRaw = localStorage.getItem("picaflor.auth.session");
  const sessionStore = sessionRaw ? JSON.parse(sessionRaw) : null;

  useEffect(() => {
    pendingStartDateRef.current = pendingStartDate;
  }, [pendingStartDate]);

  useEffect(() => {
    pendingEndDateRef.current = pendingEndDate;
  }, [pendingEndDate]);

  const loadListado = useCallback(
    async (startDate?: string, endDate?: string, esViajeOverride?: boolean) => {
      const areaId = Number(authUser?.areaId ?? authUser?.area ?? 0);
      const usuarioId = Number(authUser?.id ?? 0);
      const rangeStart = startDate ?? pendingStartDateRef.current ?? todayValue;
      const rangeEnd = endDate ?? pendingEndDateRef.current ?? todayValue;
      const useFechaViaje = esViajeOverride ?? searchByFechaViaje;

      if (!areaId || !usuarioId) {
        showToast({
          title: "Error",
          description: "No se pudo resolver AreaId/UsuarioId de la sesión.",
          type: "error",
        });
        return;
      }

      if (!rangeStart || !rangeEnd) {
        showToast({
          title: "Atención",
          description: "Debe seleccionar fecha inicio y fecha fin.",
          type: "warning",
        });
        return;
      }

      if (rangeEnd < rangeStart) {
        showToast({
          title: "Atención",
          description: "La fecha fin no puede ser menor a la fecha inicio.",
          type: "warning",
        });
        return;
      }

      lastReloadRangeRef.current = { start: rangeStart, end: rangeEnd };
      setAppliedStartDate(rangeStart);
      setAppliedEndDate(rangeEnd);
      const valores = `${rangeStart}|${rangeEnd}|${areaId}|${usuarioId}`;
      setIsLoading(true);
      try {
        const response = await listarPaqueteViaje(valores, {
          esViaje: useFechaViaje,
        });
        const parsedRows = parseListadoResponse(response);
        setAllRows(parsedRows);
        writePersistedTravelPackageDataCache({
          rows: parsedRows,
          startDate: rangeStart,
          endDate: rangeEnd,
          searchByFechaViaje: useFechaViaje,
          areaId,
          usuarioId,
        });
        clearPersistedTravelPackageStaleFlag();
      } catch (error) {
        showToast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "No se pudo cargar el listado de paquetes de viaje.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      authUser?.area,
      authUser?.areaId,
      authUser?.id,
      searchByFechaViaje,
      todayValue,
    ],
  );

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    const currentStart = pendingStartDateRef.current ?? todayValue;
    const currentEnd = pendingEndDateRef.current ?? todayValue;
    const hasStaleData = hasPersistedTravelPackageStaleFlag();
    const forceRefresh = Boolean(refreshKey) || hasStaleData;

    if (forceRefresh) {
      handledRefreshKeyRef.current = refreshKey;
      void loadListado(currentStart, currentEnd, searchByFechaViaje);
      return;
    }

    const areaId = Number(authUser?.areaId ?? authUser?.area ?? 0);
    const usuarioId = Number(authUser?.id ?? 0);
    const cache = readPersistedTravelPackageDataCache();
    const canUseCache =
      cache &&
      areaId > 0 &&
      usuarioId > 0 &&
      cache.areaId === areaId &&
      cache.usuarioId === usuarioId &&
      cache.startDate === currentStart &&
      cache.endDate === currentEnd &&
      cache.searchByFechaViaje === searchByFechaViaje;

    if (canUseCache && cache) {
      setAllRows(cache.rows);
      setAppliedStartDate(cache.startDate);
      setAppliedEndDate(cache.endDate);
      lastReloadRangeRef.current = {
        start: cache.startDate,
        end: cache.endDate,
      };
      setIsLoading(false);
      return;
    }

    void loadListado(currentStart, currentEnd, searchByFechaViaje);
  }, [
    authUser?.area,
    authUser?.areaId,
    authUser?.id,
    loadListado,
    refreshKey,
    searchByFechaViaje,
    todayValue,
  ]);

  useEffect(() => {
    if (!initialLoadRef.current) return;
    if (!refreshKey) return;
    if (handledRefreshKeyRef.current === refreshKey) return;
    handledRefreshKeyRef.current = refreshKey;

    void loadListado(
      pendingStartDateRef.current,
      pendingEndDateRef.current,
      searchByFechaViaje,
    );
  }, [refreshKey, loadListado, searchByFechaViaje]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleManualRefresh = () => {
      void loadListado(
        pendingStartDateRef.current,
        pendingEndDateRef.current,
        searchByFechaViaje,
      );
    };

    window.addEventListener(
      TRAVEL_PACKAGE_LIST_MANUAL_REFRESH_EVENT,
      handleManualRefresh,
    );

    return () => {
      window.removeEventListener(
        TRAVEL_PACKAGE_LIST_MANUAL_REFRESH_EVENT,
        handleManualRefresh,
      );
    };
  }, [loadListado, searchByFechaViaje]);

  useEffect(() => {
    let sourceRows = allRows;

    sourceRows = sourceRows.filter((row) => {
      const dateCandidate = searchByFechaViaje
        ? normalizeLegacyDateForFilter(row.fechaInicioViaje)
        : normalizeLegacyDateForFilter(row.fechaEmision);

      if (!dateCandidate) return true;
      if (appliedStartDate && dateCandidate < appliedStartDate) return false;
      if (appliedEndDate && dateCandidate > appliedEndDate) return false;
      return true;
    });

    if (selectedCondicion !== "TODOS") {
      sourceRows = sourceRows.filter(
        (row) =>
          normalizeFilterValue(row.condicionPago) ===
          normalizeFilterValue(selectedCondicion),
      );
    }

    if (selectedEstado !== "TODOS") {
      sourceRows = sourceRows.filter(
        (row) =>
          normalizeFilterValue(row.estado) ===
          normalizeFilterValue(selectedEstado),
      );
    }

    if (searchMode === "numero") {
      const query = normalizeStringValue(searchNumber);
      sourceRows = query
        ? sourceRows.filter((row) => String(row.idPaqueteViaje).includes(query))
        : sourceRows;
    }

    if (searchMode === "agencia") {
      const query = normalizeStringValue(searchAgency).toLowerCase();
      sourceRows = query
        ? sourceRows.filter((row) =>
            normalizeStringValue(row.agenciaNombre)
              .toLowerCase()
              .includes(query),
          )
        : sourceRows;
    }

    setRows(sourceRows);
  }, [
    allRows,
    appliedEndDate,
    appliedStartDate,
    searchAgency,
    searchByFechaViaje,
    searchMode,
    searchNumber,
    selectedCondicion,
    selectedEstado,
  ]);

  useEffect(() => {
    setFilteredRowsForTotals(rows);
  }, [rows]);

  const totales = useMemo(() => {
    return filteredRowsForTotals.reduce(
      (acc, row) => {
        const moneda = normalizeCurrencyForTotals(row.moneda);
        if (moneda === "DOLARES") {
          acc.totalDolares += row.totalGeneral;
          acc.acuentaDolares += row.acuenta;
          acc.saldoDolares += row.saldo;
          return acc;
        }
        if (moneda === "SOLES") {
          acc.totalSoles += row.totalGeneral;
          acc.acuentaSoles += row.acuenta;
          acc.saldoSoles += row.saldo;
        }
        return acc;
      },
      {
        totalDolares: 0,
        acuentaDolares: 0,
        saldoDolares: 0,
        totalSoles: 0,
        acuentaSoles: 0,
        saldoSoles: 0,
      },
    );
  }, [filteredRowsForTotals]);

  const handleRangeSearch = () => {
    void loadListado(pendingStartDate, pendingEndDate);
  };
  const handleExcelExport = () => {
    const exportableRows = rows.filter((row) => row.idPaqueteViaje > 0);
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
      getValue: (row: TravelPackageListadoRow) => unknown;
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
        key: "idPaqueteViaje",
        label: "Id",
        width: 10,
        numeric: true,
        align: "right",
        getValue: (row) => row.idPaqueteViaje,
      },
      {
        key: "fechaEmision",
        label: "Fecha emision",
        width: 14,
        getValue: (row) => row.fechaEmision,
      },
      {
        key: "programa",
        label: "Programa",
        width: 28,
        getValue: (row) => row.programa,
      },
      {
        key: "agenciaNombre",
        label: "Agencia",
        width: 24,
        getValue: (row) => row.agenciaNombre,
      },
      {
        key: "primerPasajero",
        label: "Primer pasajero",
        width: 24,
        getValue: (row) => row.primerPasajero,
      },
      {
        key: "condicionPago",
        label: "Condicion",
        width: 14,
        getValue: (row) => row.condicionPago,
      },
      {
        key: "moneda",
        label: "Moneda",
        width: 12,
        getValue: (row) => row.moneda,
      },
      {
        key: "totalGeneral",
        label: "Total",
        width: 12,
        numeric: true,
        money: true,
        align: "right",
        getValue: (row) => row.totalGeneral,
      },
      {
        key: "acuenta",
        label: "A cuenta",
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
        key: "estado",
        label: "Estado",
        width: 14,
        align: "center",
        getValue: (row) => row.estado,
      },
    );

    const data = exportableRows.map((row) => {
      const rowData: Record<string, string | number> = {};
      exportColumns.forEach((column) => {
        const rawValue = column.getValue(row);
        rowData[column.label] = column.numeric
          ? Number(rawValue ?? 0) || 0
          : normalizeStringValue(rawValue);
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
    XLSX.utils.book_append_sheet(wb, ws, "PaqueteViaje");

    const fileStart = pendingStartDateRef.current || todayValue;
    const fileEnd = pendingEndDateRef.current || todayValue;
    const fileDatePart =
      fileStart === fileEnd ? fileStart : `${fileStart}_a_${fileEnd}`;

    XLSX.writeFile(wb, `paquetes-viaje-${fileDatePart}.xlsx`);
  };

  const columns = useMemo<ColumnDef<TravelPackageListadoRow>[]>(() => {
    const cols: ColumnDef<TravelPackageListadoRow>[] = [];

    if (sessionStore?.user?.areaId === "6") {
      cols.push(
        columnHelper.display({
          id: "pVerificado",
          size: 110,
          header: "Verificado",
          meta: { align: "center" },
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
        header: "Acciones",
        meta: { align: "center" },
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/paquete-viaje/${row.original.idPaqueteViaje}/edit`, {
                state: { listItem: row.original },
              });
            }}
            className="text-sm cursor-pointer font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Ver
          </button>
        ),
      }),
      columnHelper.accessor("idPaqueteViaje", {
        header: "Id",
        meta: { align: "center" },
      }),
      columnHelper.accessor("fechaEmision", {
        header: "Fecha emision",
      }),
      columnHelper.accessor("programa", {
        header: "Programa",
      }),
      columnHelper.accessor("agenciaNombre", {
        header: "Agencia",
      }),
      columnHelper.accessor("primerPasajero", {
        header: "Primer pasajero",
      }),
      columnHelper.accessor("condicionPago", {
        header: "Condición",
      }),
      columnHelper.accessor("moneda", {
        header: "Moneda",
      }),
      columnHelper.accessor("totalGeneral", {
        header: "Total",
        meta: { align: "right" },
        cell: ({ row }) => row.original.totalGeneral.toFixed(2),
      }),
      columnHelper.accessor("acuenta", {
        header: "A cuenta",
        meta: { align: "right" },
        cell: ({ row }) => row.original.acuenta.toFixed(2),
      }),
      columnHelper.accessor("saldo", {
        header: "Saldo",
        meta: { align: "right" },
        cell: ({ row }) => row.original.saldo.toFixed(2),
      }),
      columnHelper.accessor("estado", {
        header: "Estado",
        meta: { align: "center" },
      }),
    );
    return cols;
  }, [columnHelper, isPagoVerificado, navigate, sessionStore?.user?.areaId]);

  const SearchInputComponent = ({
    globalFilter,
    setGlobalFilter,
  }: {
    globalFilter: string;
    setGlobalFilter: (value: string) => void;
  }) => {
    const AddButton = () => (
      <button
        type="button"
        onClick={() => navigate("/paquete-viaje/new")}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow transition hover:bg-emerald-700"
      >
        <Plus size={16} />
      </button>
    );

    const handleToggleSearchByNumero = (checked: boolean) => {
      if (checked) {
        setSearchMode("numero");
        setSearchAgency("");
        setSearchByFechaViaje(false);
        setGlobalFilter("");
        void loadListado(pendingStartDate, pendingEndDate, false);
        return;
      }
      setSearchMode("none");
      setSearchNumber("");
    };

    const handleToggleSearchByAgencia = (checked: boolean) => {
      if (checked) {
        setSearchMode("agencia");
        setSearchNumber("");
        setGlobalFilter("");
        return;
      }
      setSearchMode("none");
      setSearchAgency("");
    };

    const handleToggleSearchByFechaViaje = (checked: boolean) => {
      setSearchByFechaViaje(checked);
      void loadListado(pendingStartDate, pendingEndDate, checked);
    };

    return (
      <div className="w-full max-w-full space-y-2 sm:max-w-lg lg:max-w-xl">
        <div className="flex min-w-0 items-center gap-2 text-xs text-slate-600 sm:gap-4">
          <div className="flex shrink-0 items-end justify-between gap-4">
            <ChevronLeft
              className="cursor-pointer"
              onClick={() => {
                navigate("/fullday");
              }}
            />
          </div>
          <label className="inline-flex min-w-0 flex-1 items-center gap-2">
            <input
              type="checkbox"
              checked={searchMode === "agencia"}
              onChange={(event) =>
                handleToggleSearchByAgencia(event.target.checked)
              }
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="truncate">Agencia</span>
          </label>
          <label className="inline-flex min-w-0 flex-1 items-center gap-2">
            <input
              type="checkbox"
              checked={searchMode === "numero"}
              onChange={(event) =>
                handleToggleSearchByNumero(event.target.checked)
              }
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="truncate">Numero de paquete</span>
          </label>
          <label className="inline-flex min-w-0 flex-1 items-center gap-2">
            <input
              type="checkbox"
              checked={searchByFechaViaje}
              onChange={(event) =>
                handleToggleSearchByFechaViaje(event.target.checked)
              }
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="truncate">Fecha viaje</span>
          </label>
        </div>

        {searchMode === "none" && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
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
            <AddButton />
          </div>
        )}

        {searchMode === "numero" && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchNumber}
                onChange={(event) => setSearchNumber(event.target.value)}
                placeholder="Buscar por numero de paquete"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <AddButton />
            </div>
          </div>
        )}

        {searchMode === "agencia" && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                list="travel-package-agency-options"
                type="text"
                value={searchAgency}
                onChange={(event) => setSearchAgency(event.target.value)}
                placeholder="Buscar por agencia"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <AddButton />
            </div>
            <datalist id="travel-package-agency-options">
              {Array.from(
                new Set(
                  allRows
                    .map((row) => normalizeStringValue(row.agenciaNombre))
                    .filter(Boolean),
                ),
              ).map((agency) => (
                <option key={agency} value={agency} />
              ))}
            </datalist>
          </div>
        )}
      </div>
    );
  };

  const DateRangeFilter = () => (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-[660px] items-end gap-3">
        <div className="grid min-w-0 flex-1 grid-cols-4 gap-3">
          <div className="flex min-w-[130px] flex-col gap-1 text-xs text-slate-500">
            <label className="font-medium text-slate-600">Fecha Inicio</label>
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="es"
              localeText={
                esES.components.MuiLocalizationProvider.defaultProps.localeText
              }
            >
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
                      width: "100%",
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

          <div className="flex min-w-[130px] flex-col gap-1 text-xs text-slate-500">
            <label className="font-medium text-slate-600">Fecha Fin</label>
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="es"
              localeText={
                esES.components.MuiLocalizationProvider.defaultProps.localeText
              }
            >
              <DatePicker
                format="DD/MM/YY"
                value={pendingEndDate ? dayjs(pendingEndDate) : null}
                onOpen={() => {
                  endDateAcceptedRef.current = false;
                }}
                onChange={(value) => {
                  const nextValue = value?.format("YYYY-MM-DD") ?? "";
                  setPendingEndDate(nextValue);
                }}
                onAccept={(value) => {
                  const nextValue = value?.format("YYYY-MM-DD") ?? "";
                  endDateAcceptedRef.current = true;
                  setPendingEndDate(nextValue);
                  void loadListado(pendingStartDateRef.current, nextValue);
                }}
                onClose={() => {
                  if (endDateAcceptedRef.current) {
                    endDateAcceptedRef.current = false;
                    return;
                  }

                  const currentStart = pendingStartDateRef.current ?? "";
                  const currentEnd = pendingEndDateRef.current ?? "";
                  const lastRange = lastReloadRangeRef.current;
                  const mustReload =
                    !lastRange ||
                    lastRange.start !== currentStart ||
                    lastRange.end !== currentEnd;

                  if (mustReload) {
                    void loadListado(currentStart, currentEnd);
                  }
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: {
                      width: "100%",
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

          <div className="flex min-w-[110px] flex-col gap-1 text-xs text-slate-500">
            <label className="font-medium text-slate-600">Condición</label>
            <select
              value={selectedCondicion}
              onChange={(event) =>
                setSelectedCondicion(event.target.value as CondicionFilterValue)
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {CONDICION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex min-w-[110px] flex-col gap-1 text-xs text-slate-500">
            <label className="font-medium text-slate-600">Estado</label>
            <select
              value={selectedEstado}
              onChange={(event) =>
                setSelectedEstado(event.target.value as EstadoFilterValue)
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {ESTADO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex shrink-0 flex-row gap-3">
          <button
            type="button"
            onClick={handleRangeSearch}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700 text-white shadow transition hover:bg-slate-800 disabled:opacity-60"
          >
            <Search size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              handleExcelExport();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow transition hover:bg-emerald-700"
          >
            <FileSpreadsheet size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <DndTable
        data={rows}
        onFilteredDataChange={setFilteredRowsForTotals}
        columns={columns}
        paginationState={tablePagination}
        onPaginationStateChange={setTablePagination}
        autoResetPageIndex={false}
        pageSizeOptions={[5, 10, 20, 50]}
        searchColumns={[
          "idPaqueteViaje",
          "programa",
          "agenciaNombre",
          "counterNombre",
          "primerPasajero",
          "estado",
          "condicionPago",
          "moneda",
        ]}
        enableSearching
        searchInputComponent={SearchInputComponent}
        isLoading={isLoading}
        enableDateFilter={false}
        enableFiltering={false}
        enableSorting={false}
        emptyMessage={`No hay paquetes entre ${toDdMmYyyy(
          appliedStartDate,
        )} y ${toDdMmYyyy(appliedEndDate)}.`}
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
                        Dolares - Total
                      </div>
                      <div className="font-medium text-slate-800">
                        {formatTotalsAmount(totales.totalDolares)}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top border-l border-slate-200">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Dolares - A cuenta
                      </div>
                      <div className="font-medium text-slate-800">
                        {formatTotalsAmount(totales.acuentaDolares)}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top border-l border-slate-200">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Dolares - Saldo
                      </div>
                      <div className="font-semibold text-slate-900">
                        {formatTotalsAmount(totales.saldoDolares)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 align-top">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Soles - Total
                      </div>
                      <div className="font-medium text-slate-800">
                        {formatTotalsAmount(totales.totalSoles)}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top border-l border-slate-200">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Soles - A cuenta
                      </div>
                      <div className="font-medium text-slate-800">
                        {formatTotalsAmount(totales.acuentaSoles)}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top border-l border-slate-200">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Soles - Saldo
                      </div>
                      <div className="font-semibold text-slate-900">
                        {formatTotalsAmount(totales.saldoSoles)}
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
            when: (row) => normalizeFilterValue(row.estado) === "ANULADO",
            className: "bg-red-50 text-red-700",
          },
          {
            when: (row) =>
              normalizeFilterValue(row.estado) !== "ANULADO" &&
              normalizeFilterValue(row.condicionPago) === "CREDITO",
            className: "bg-orange-200 text-orange-700",
          },
          {
            when: (row) =>
              normalizeFilterValue(row.estado) !== "ANULADO" &&
              normalizeFilterValue(row.estado) === "PENDIENTE",
            className: "bg-yellow-50 text-yellow-800",
          },
        ]}
      />
    </div>
  );
};

export default TravelPackageList;
