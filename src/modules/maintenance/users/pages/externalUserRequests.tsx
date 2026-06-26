import { useCallback, useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Check, XCircle } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { showToast } from "@/components/ui/AppToast";
import { useDialogStore } from "@/app/store/dialogStore";
import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";
import { useMaintenanceAccessResolver } from "../../permissions/useMaintenanceAccessResolver";

type SolicitudUsuarioExterno = {
  id: number;
  solicitudId: number;
  canalVentaId: number;
  canalVentaNombre?: string;
  nombres?: string;
  apellidos?: string;
  usuarioAlias?: string;
  email?: string;
  telefono?: string;
  estado?: string;
  fechaSolicitud?: string;
  comentario?: string;
};

const estados = ["PENDIENTE", "APROBADA", "RECHAZADA"] as const;

const mapSolicitud = (item: any): SolicitudUsuarioExterno => {
  const solicitudId = Number(item?.solicitudId ?? item?.SolicitudId ?? 0);
  return {
    id: solicitudId,
    solicitudId,
    canalVentaId: Number(item?.canalVentaId ?? item?.CanalVentaId ?? 0),
    canalVentaNombre: item?.canalVentaNombre ?? item?.CanalVentaNombre ?? "",
    nombres: item?.nombres ?? item?.Nombres ?? "",
    apellidos: item?.apellidos ?? item?.Apellidos ?? "",
    usuarioAlias: item?.usuarioAlias ?? item?.UsuarioAlias ?? "",
    email: item?.email ?? item?.Email ?? "",
    telefono: item?.telefono ?? item?.Telefono ?? "",
    estado: item?.estado ?? item?.Estado ?? "",
    fechaSolicitud: item?.fechaSolicitud ?? item?.FechaSolicitud ?? "",
    comentario: item?.comentario ?? item?.Comentario ?? "",
  };
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-PE");
};

const ExternalUserRequests = () => {
  const openDialog = useDialogStore((state) => state.openDialog);
  const resolveAccess = useMaintenanceAccessResolver();
  const access = resolveAccess("maintenance.external_user_requests");
  const [estado, setEstado] = useState<(typeof estados)[number]>("PENDIENTE");
  const [rows, setRows] = useState<SolicitudUsuarioExterno[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest<any[]>({
        url: `${API_BASE_URL}/SolicitudesUsuarioExterno?estado=${encodeURIComponent(estado)}`,
        method: "GET",
        fallback: [],
      });
      setRows(Array.isArray(response) ? response.map(mapSolicitud) : []);
    } finally {
      setIsLoading(false);
    }
  }, [estado]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const aprobar = useCallback(
    (row: SolicitudUsuarioExterno) => {
      if (!access.create) return;

      openDialog({
        title: "Aprobar solicitud",
        description: `Se creara el usuario ${row.usuarioAlias}.`,
        size: "sm",
        confirmLabel: "Aprobar",
        initialPayload: {
          usuarioClave: "",
          comentario: "",
        },
        content: ({ payload, setPayload }) => (
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Clave temporal</span>
              <input
                type="password"
                value={String(payload.usuarioClave ?? "")}
                onChange={(event) =>
                  setPayload({ ...payload, usuarioClave: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Comentario</span>
              <textarea
                value={String(payload.comentario ?? "")}
                onChange={(event) =>
                  setPayload({ ...payload, comentario: event.target.value })
                }
                className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </label>
          </div>
        ),
        onConfirm: async (payload) => {
          const usuarioClave = String(payload.usuarioClave ?? "").trim();
          if (!usuarioClave) {
            showToast({ title: "Atencion", description: "Ingresa una clave temporal.", type: "warning" });
            return false;
          }

          await apiRequest({
            url: `${API_BASE_URL}/SolicitudesUsuarioExterno/${row.solicitudId}/aprobar`,
            method: "POST",
            data: {
              usuarioClave,
              comentario: String(payload.comentario ?? "").trim(),
            },
          });
          showToast({ title: "Exito", description: "Solicitud aprobada.", type: "success" });
          await fetchRows();
          return true;
        },
      });
    },
    [access.create, fetchRows, openDialog],
  );

  const rechazar = useCallback(
    (row: SolicitudUsuarioExterno) => {
      if (!access.delete) return;

      openDialog({
        title: "Rechazar solicitud",
        description: `Solicitud de ${row.usuarioAlias}.`,
        size: "sm",
        confirmLabel: "Rechazar",
        initialPayload: { comentario: "" },
        content: ({ payload, setPayload }) => (
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Comentario</span>
            <textarea
              value={String(payload.comentario ?? "")}
              onChange={(event) =>
                setPayload({ ...payload, comentario: event.target.value })
              }
              className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>
        ),
        onConfirm: async (payload) => {
          await apiRequest({
            url: `${API_BASE_URL}/SolicitudesUsuarioExterno/${row.solicitudId}/rechazar`,
            method: "POST",
            data: {
              comentario: String(payload.comentario ?? "").trim(),
            },
          });
          showToast({ title: "Exito", description: "Solicitud rechazada.", type: "success" });
          await fetchRows();
          return true;
        },
      });
    },
    [access.delete, fetchRows, openDialog],
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<SolicitudUsuarioExterno>();
    return [
      columnHelper.accessor("usuarioAlias", {
        header: "Usuario",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.display({
        id: "nombre",
        header: "Nombre",
        cell: ({ row }) =>
          `${row.original.nombres ?? ""} ${row.original.apellidos ?? ""}`.trim() || "-",
      }),
      columnHelper.accessor("canalVentaNombre", {
        header: "Canal",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("telefono", {
        header: "Telefono",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("fechaSolicitud", {
        header: "Fecha",
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor("estado", {
        header: "Estado",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        meta: { align: "center" },
        cell: ({ row }) =>
          row.original.estado === "PENDIENTE" ? (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={!access.create}
                onClick={(event) => {
                  event.stopPropagation();
                  aprobar(row.original);
                }}
                className="text-emerald-600 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                title="Aprobar"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!access.delete}
                onClick={(event) => {
                  event.stopPropagation();
                  rechazar(row.original);
                }}
                className="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                title="Rechazar"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          ) : (
            "-"
          ),
      }),
    ];
  }, [access.create, access.delete, aprobar, rechazar]);

  return (
    <MaintenancePageFrame
      title="Solicitudes externas"
      description="Aprueba o rechaza accesos solicitados por usuarios externos."
    >
      <DndTable
        data={rows}
        columns={columns}
        isLoading={isLoading}
        enableDateFilter={false}
        emptyMessage="No hay solicitudes"
        dateFilterComponent={() => (
          <select
            value={estado}
            onChange={(event) =>
              setEstado(event.target.value as (typeof estados)[number])
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:w-auto"
          >
            {estados.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        )}
      />
    </MaintenancePageFrame>
  );
};

export default ExternalUserRequests;
