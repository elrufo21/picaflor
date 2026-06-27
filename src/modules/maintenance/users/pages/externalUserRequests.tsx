import { useCallback, useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Check, Eye, EyeOff, Wrench, XCircle } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { showToast } from "@/components/ui/AppToast";
import { useDialogStore } from "@/app/store/dialogStore";
import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
import {
  buildSalesChannelFormData,
  type SaveSalesChannelPayload,
} from "../../salesChannel/hooks/useSalesChannels";
import {
  buildPayload,
  CanalVentaDialogForm,
  getTodayDateInputValue,
  parseCanalId,
  parsePriceValue,
  type CanalVentaDialogPayload,
} from "../../salesChannel/pages/salesChannelPage";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";
import { useMaintenanceAccessResolver } from "../../permissions/useMaintenanceAccessResolver";

type SolicitudUsuarioExterno = {
  id: number;
  solicitudId: number;
  canalVentaId: number;
  canalVentaNombre?: string;
  ruc?: string;
  razonSocial?: string;
  canalExiste?: boolean;
  logo?: string;
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

const normalizeBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "si", "sí", "s", "yes"].includes(normalized);
};

const mapSolicitud = (item: Record<string, unknown>): SolicitudUsuarioExterno => {
  const solicitudId = Number(item?.solicitudId ?? item?.SolicitudId ?? 0);
  const canalVentaId = Number(item?.canalVentaId ?? item?.CanalVentaId ?? 0);
  const canalExisteRaw = item?.canalExiste ?? item?.CanalExiste;
  return {
    id: solicitudId,
    solicitudId,
    canalVentaId,
    canalVentaNombre: item?.canalVentaNombre ?? item?.CanalVentaNombre ?? "",
    ruc: item?.ruc ?? item?.Ruc ?? item?.RUC ?? "",
    razonSocial: item?.razonSocial ?? item?.RazonSocial ?? "",
    logo: item?.logo ?? item?.Logo ?? item?.imagen ?? item?.Imagen ?? "",
    canalExiste:
      canalExisteRaw === undefined || canalExisteRaw === null
        ? canalVentaId > 0
        : normalizeBoolean(canalExisteRaw),
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

const isPending = (row: SolicitudUsuarioExterno) =>
  String(row.estado ?? "").trim().toUpperCase() === "PENDIENTE";

const PasswordField = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 outline-none focus:border-blue-500"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
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
      const response = await apiRequest<Record<string, unknown>[]>({
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
      if (!row.canalVentaId || !row.canalExiste) {
        showToast({
          title: "Atencion",
          description: "Regulariza el canal antes de aprobar.",
          type: "warning",
        });
        return;
      }

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
              <PasswordField
                value={String(payload.usuarioClave ?? "")}
                onChange={(usuarioClave) =>
                  setPayload({ ...payload, usuarioClave })
                }
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

  const regularizar = useCallback(
    (row: SolicitudUsuarioExterno) => {
      if (!access.create) return;
      const todayDate = getTodayDateInputValue();

      openDialog({
        title: "Regularizar canal de venta",
        description: `Completa los datos del canal para ${row.usuarioAlias}.`,
        size: "md",
        confirmLabel: "Regularizar",
        cancelLabel: "Cancelar",
        initialPayload: {
          ruc: row.ruc ?? "",
          razonSocial: row.razonSocial ?? "",
          label: row.razonSocial ?? row.canalVentaNombre ?? "",
          direccion: "",
          region: "",
          value: row.canalVentaId ? String(row.canalVentaId) : "",
          contacto: `${row.nombres ?? ""} ${row.apellidos ?? ""}`.trim(),
          contacto02: "",
          telefono: row.telefono ?? "",
          celular: "",
          email: row.email ?? "",
          webSite: "",
          logo: row.logo ?? "",
          limiteCredito: "",
          clasificacion: "",
          categoria: "",
          fechaLimiteCredito: "",
          fechaAniversario: todayDate,
          representanteLegal: "",
          fechaNacimiento: todayDate,
          nota: "",
          permiteLiquidacionCredito: false,
          productoId: "",
          precioDolares: "",
          precioSoles: "",
          imageFile: null,
          imagePreview: row.logo ?? "",
          search: "",
          editingValue: row.canalVentaId ? String(row.canalVentaId) : "",
        },
        content: ({ payload, setPayload }) => (
          <CanalVentaDialogForm
            payload={payload as CanalVentaDialogPayload}
            setPayload={setPayload}
            fetchAuxiliarProductPrice={async () => null}
            fetchAuxiliarProductPrices={async () => []}
          />
        ),
        onConfirm: async (data) => {
          const label = String(data.label ?? "").trim();
          const contacto = String(data.contacto ?? "").trim();
          const telefono = String(data.telefono ?? "").trim();

          if (!label || !contacto || !telefono) {
            showToast({
              title: "Atencion",
              description: "Completa nombre, contacto y telefono del canal.",
              type: "warning",
            });
            return false;
          }

          const payload = buildPayload(
            {
              ruc: String(data.ruc ?? "").trim(),
              razonSocial: String(data.razonSocial ?? "").trim(),
              label,
              direccion: String(data.direccion ?? "").trim(),
              region: String(data.region ?? "").trim(),
              contacto,
              contacto02: String(data.contacto02 ?? "").trim(),
              telefono,
              celular: String(data.celular ?? "").trim(),
              email: String(data.email ?? "").trim(),
              webSite: String(data.webSite ?? "").trim(),
              logo: String(data.logo ?? "").trim(),
              limiteCredito: String(data.limiteCredito ?? "").trim(),
              clasificacion: String(data.clasificacion ?? "").trim(),
              categoria: String(data.categoria ?? "").trim(),
              fechaLimiteCredito: String(data.fechaLimiteCredito ?? "").trim(),
              fechaAniversario: String(data.fechaAniversario ?? "").trim(),
              representanteLegal: String(data.representanteLegal ?? "").trim(),
              fechaNacimiento: String(data.fechaNacimiento ?? "").trim(),
              nota: String(data.nota ?? "").trim(),
              permiteLiquidacionCredito: Boolean(data.permiteLiquidacionCredito),
              imageFile: data.imageFile instanceof File ? data.imageFile : null,
            },
            row.canalVentaId,
          );
          const formData = buildSalesChannelFormData(
            payload as SaveSalesChannelPayload,
          );
          const productoId = parseCanalId(String(data.productoId ?? ""));
          if (productoId > 0) {
            formData.append("ProductoId", String(productoId));
            formData.append("PrecioDolares", String(parsePriceValue(data.precioDolares)));
            formData.append("PrecioSoles", String(parsePriceValue(data.precioSoles)));
          }

          await apiRequest({
            url: `${API_BASE_URL}/SolicitudesUsuarioExterno/${row.solicitudId}/regularizar-canal`,
            method: "POST",
            data: formData,
          });

          showToast({
            title: "Exito",
            description: "Canal regularizado.",
            type: "success",
          });
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
        cell: ({ row }) =>
          row.original.canalVentaId
            ? row.original.canalExiste
              ? row.original.canalVentaNombre || "-"
              : "Pendiente regularización"
            : "Pendiente regularización",
      }),
      columnHelper.accessor("ruc", {
        header: "RUC",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("razonSocial", {
        header: "Razon social",
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
          isPending(row.original) ? (
            <div className="flex items-center justify-center gap-3">
              {!row.original.canalVentaId || !row.original.canalExiste ? (
                <button
                  type="button"
                  disabled={!access.create}
                  onClick={(event) => {
                    event.stopPropagation();
                    regularizar(row.original);
                  }}
                  className="text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Regularizar"
                >
                  <Wrench className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                disabled={
                  !access.create ||
                  !row.original.canalVentaId ||
                  !row.original.canalExiste
                }
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
  }, [access.create, access.delete, aprobar, rechazar, regularizar]);

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
