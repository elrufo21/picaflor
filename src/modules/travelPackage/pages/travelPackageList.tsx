import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import { Plus, Search } from "lucide-react";

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
};

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

const normalizeCell = (value: unknown) => normalizeLegacyXmlPayload(String(value ?? "")).trim();

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
      Number.isFinite(idPaqueteViaje) && idPaqueteViaje > 0 ? idPaqueteViaje : 0,
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
  };
};

const parseListadoResponse = (raw: unknown): TravelPackageListadoRow[] => {
  if (!raw) return [];

  const pushParsedRows = (payload: string, target: TravelPackageListadoRow[]) => {
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

const TravelPackageList = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const [fechaInicio, setFechaInicio] = useState(getTodayIso());
  const [fechaFin, setFechaFin] = useState(getTodayIso());
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<TravelPackageListadoRow[]>([]);

  const loadListado = useCallback(async () => {
    const areaId = Number(authUser?.areaId ?? authUser?.area ?? 0);
    const usuarioId = Number(authUser?.id ?? 0);

    if (!areaId || !usuarioId) {
      showToast({
        title: "Error",
        description: "No se pudo resolver AreaId/UsuarioId de la sesión.",
        type: "error",
      });
      return;
    }

    if (!fechaInicio || !fechaFin) {
      showToast({
        title: "Atención",
        description: "Debe seleccionar fecha inicio y fecha fin.",
        type: "warning",
      });
      return;
    }

    if (fechaFin < fechaInicio) {
      showToast({
        title: "Atención",
        description: "La fecha fin no puede ser menor a la fecha inicio.",
        type: "warning",
      });
      return;
    }

    const valores = `${fechaInicio}|${fechaFin}|${areaId}|${usuarioId}`;
    setIsLoading(true);
    try {
      const response = await listarPaqueteViaje(valores);
      setRows(parseListadoResponse(response));
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
  }, [authUser?.area, authUser?.areaId, authUser?.id, fechaFin, fechaInicio]);

  useEffect(() => {
    void loadListado();
  }, [loadListado]);

  const columns = useMemo<ColumnDef<TravelPackageListadoRow>[]>(
    () => [
      {
        accessorKey: "idPaqueteViaje",
        header: "Id",
        meta: { align: "center" },
      },
      {
        accessorKey: "fechaEmision",
        header: "Fecha emision",
      },
      {
        accessorKey: "programa",
        header: "Programa",
      },
      {
        accessorKey: "agenciaNombre",
        header: "Agencia",
      },
      {
        accessorKey: "primerPasajero",
        header: "Primer pasajero",
      },
      {
        accessorKey: "totalGeneral",
        header: "Total",
        meta: { align: "right" },
        cell: ({ row }) => row.original.totalGeneral.toFixed(2),
      },
      {
        accessorKey: "saldo",
        header: "Saldo",
        meta: { align: "right" },
        cell: ({ row }) => row.original.saldo.toFixed(2),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        meta: { align: "center" },
      },
      {
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
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          >
            Editar
          </button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(event) => setFechaFin(event.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void loadListado()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
              >
                <Search size={16} />
                Buscar
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/paquete-viaje/new")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
          >
            <Plus size={16} />
            Nuevo paquete
          </button>
        </div>
      </div>

      <DndTable
        data={rows}
        columns={columns}
        isLoading={isLoading}
        enableDateFilter={false}
        enableFiltering={false}
        enableSorting={false}
        emptyMessage={`No hay paquetes entre ${toDdMmYyyy(fechaInicio)} y ${toDdMmYyyy(
          fechaFin,
        )}.`}
      />
    </div>
  );
};

export default TravelPackageList;

