import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";

import DndTable from "@/components/dataTabla/DndTable";
import { useAuthStore } from "@/store/auth/auth.store";
import { fetchPedidosFecha } from "../api/fulldayApi";
import { usePackageStore } from "../store/fulldayStore";
import type { Producto } from "@/app/db/serviciosDB";
import { hasServiciosData, serviciosDB } from "@/app/db/serviciosDB";

const LEGACY_ROW_SEPARATOR = "\u00ac";

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
] as const;

type LiquidacionFieldDefinition = (typeof LIQUIDACION_FIELDS)[number];
type LiquidacionFieldKey = LiquidacionFieldDefinition["key"];
type LiquidacionRow = Record<LiquidacionFieldKey, string> & { id: string };

const EXPECTED_FIELDS =
  Math.max(...LIQUIDACION_FIELDS.map((field) => field.sourceIndex)) + 1;

const parseLiquidacionRow = (
  rowText: string,
  index: number
): LiquidacionRow => {
  const rawValues = rowText.split("|");
  const normalizedValues =
    rawValues.length > EXPECTED_FIELDS
      ? rawValues
          .slice(0, EXPECTED_FIELDS - 1)
          .concat(rawValues.slice(EXPECTED_FIELDS - 1).join("|"))
      : rawValues;

  const rowRecord = LIQUIDACION_FIELDS.reduce((acc, field) => {
    const value = normalizedValues[field.sourceIndex] ?? "";
    acc[field.key] = value.trim();
    return acc;
  }, {} as Record<LiquidacionFieldKey, string>);

  return {
    ...rowRecord,
    id: rowRecord.notaId || String(index + 1),
  };
};

const parseLiquidacionesPayload = (payload: string | null | undefined) => {
  const trimmed = String(payload ?? "").trim();
  if (!trimmed || trimmed === "~") return [];
  const normalized = trimmed.replace(/~/g, LEGACY_ROW_SEPARATOR);
  return normalized
    .split(LEGACY_ROW_SEPARATOR)
    .map((row) => row.trim())
    .filter((row) => row && row !== "~")
    .map((row, index) => parseLiquidacionRow(row, index));
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
  };
};

const LiquidacionesPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { loadServicios, loadServiciosFromDB } = usePackageStore();
  const [rows, setRows] = useState<LiquidacionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const todayValue = new Date().toISOString().slice(0, 10);
  const priorDate = new Date();
  priorDate.setDate(priorDate.getDate() - 7);
  const [pendingStartDate, setPendingStartDate] = useState(
    priorDate.toISOString().slice(0, 10)
  );
  const [pendingEndDate, setPendingEndDate] = useState(todayValue);

  useEffect(() => {
    let canceled = false;
    const loadProductos = async () => {
      try {
        const hasData = await hasServiciosData();
        if (hasData) {
          await loadServiciosFromDB();
        } else {
          await loadServicios();
        }
        const stored = await serviciosDB.productos.toArray();
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
      (product) => normalizeProductName(product.nombre) === normalizedRowName
    );
    if (exactMatch) return exactMatch.id;
    const containsMatch = productos.find((product) =>
      normalizedRowName.includes(normalizeProductName(product.nombre))
    );
    if (containsMatch) return containsMatch.id;
    return 0;
  };

  const handleView = (row: LiquidacionRow) => {
    const productId = resolveProductId(row);
    const targetId = productId || Number(row.notaId) || Number(row.id) || 0;
    if (!targetId) {
      setError("No se pudo determinar la programación asociada");
      return;
    }
    setError(null);
    const formData = buildLiquidacionFormData(row);
    navigate(`/fullday/${targetId}/passengers/view/${row.notaId}`, {
      state: { liquidacion: formData },
    });
  };

  const columnHelper = createColumnHelper<LiquidacionRow>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => handleView(row.original)}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Ver
          </button>
        ),
      }),
      columnHelper.accessor("notaId", {
        header: "LQ",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("serieNumero", {
        header: "Serie-Número",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("clienteNombre", {
        header: "Cliente",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("clienteTelefono", {
        header: "Teléfono",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("fechaViaje", {
        header: "Fecha viaje",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("fechaRegistro", {
        header: "Registrado",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("formaPago", {
        header: "Forma de pago",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("totalPagar", {
        header: "Total",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("acuenta", {
        header: "A cuenta",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("saldo", {
        header: "Saldo",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("estado", {
        header: "Estado",
        cell: (info) => info.getValue(),
      }),
    ],
    [columnHelper, navigate]
  );

  const reload = async (
    startDate = pendingStartDate || priorDate.toISOString().slice(0, 10),
    endDate = pendingEndDate || todayValue
  ) => {
    if (!user) {
      setError("Usuario no autenticado");
      return;
    }
    const areaId = Number(user.areaId ?? user.area ?? 0);
    const usuarioId = Number(user.id ?? 0);
    const rangeStart = startDate || todayValue;
    const rangeEnd = endDate || todayValue;
    if (!areaId || !usuarioId) {
      setError("Falta área o usuario");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = await fetchPedidosFecha({
        fechaInicio: rangeStart,
        fechaFin: rangeEnd,
        areaId,
        usuarioId,
      });
      setRows(parseLiquidacionesPayload(payload));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo cargar las liquidaciones";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeSearch = () => {
    reload(pendingStartDate, pendingEndDate);
  };

  const handleListAll = () => {
    const start = "1900-01-01";
    const end = todayValue;
    setPendingStartDate(start);
    setPendingEndDate(end);
    reload(start, end);
  };

  useEffect(() => {
    reload();
  }, [user]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Liquidaciones</p>
          <p className="text-xs text-slate-500">
            Listado generado desde el módulo de programación.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-slate-900">Buscar por</div>
          <div className="flex flex-col text-xs text-slate-500">
            <span>Fecha Inicio</span>
            <input
              type="date"
              value={pendingStartDate}
              onChange={(e) => setPendingStartDate(e.target.value)}
              className="w-32 rounded-md border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
            />
          </div>
          <div className="flex flex-col text-xs text-slate-500">
            <span>Fecha Fin</span>
            <input
              type="date"
              value={pendingEndDate}
              onChange={(e) => setPendingEndDate(e.target.value)}
              className="w-32 rounded-md border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-700"
            />
          </div>
          <button
            type="button"
            onClick={handleRangeSearch}
            disabled={loading}
            className="text-sm font-semibold text-slate-700 underline-offset-2 hover:underline disabled:opacity-60"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={handleListAll}
            className="text-sm font-semibold text-slate-500 underline-offset-2 hover:underline"
          >
            Listar todo
          </button>
        </div>
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
          "auxiliar",
          "notaUsuario",
          "serieNumero",
          "numero",
          "cantidadPax",
          "productoNombre",
        ]}
        enableSearching
        isLoading={loading}
        emptyMessage="No se encontraron liquidaciones"
      />
    </div>
  );
};

export default LiquidacionesPage;
