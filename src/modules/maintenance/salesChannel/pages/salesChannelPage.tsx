import { useCallback, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { useDialogStore } from "@/app/store/dialogStore";
import { showToast } from "@/components/ui/AppToast";
import { queueServiciosRefresh } from "@/app/db/serviciosSync";
import { TextControlled } from "@/components/ui/inputs";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";
import {
  type SalesChannelDetail,
  type SaveSalesChannelPayload,
  useSalesChannels,
} from "../hooks/useSalesChannels";
import { useMaintenanceAccessResolver } from "../../permissions/useMaintenanceAccessResolver";

const emailRegex = /^[^\s@]+@[^\s@]+\.com$/i;

type CanalVentaDialogValues = {
  ruc: string;
  razonSocial: string;
  label: string;
  direccion: string;
  region: string;
  contacto: string;
  contacto02: string;
  telefono: string;
  celular: string;
  email: string;
  webSite: string;
  clasificacion: string;
  categoria: string;
  fechaAniversario: string;
  representanteLegal: string;
  fechaNacimiento: string;
  nota: string;
};

type CanalVentaDialogPayload = Partial<CanalVentaDialogValues> & {
  value?: string;
  search?: string;
  editingValue?: string;
};

const CanalVentaDialogForm = ({
  payload,
  setPayload,
}: {
  payload: CanalVentaDialogPayload;
  setPayload: (next: Record<string, unknown>) => void;
}) => {
  const { control } = useForm<CanalVentaDialogValues>({
    defaultValues: {
      ruc: String(payload.ruc ?? ""),
      razonSocial: String(payload.razonSocial ?? ""),
      label: String(payload.label ?? ""),
      direccion: String(payload.direccion ?? ""),
      region: String(payload.region ?? ""),
      contacto: String(payload.contacto ?? ""),
      contacto02: String(payload.contacto02 ?? ""),
      telefono: String(payload.telefono ?? ""),
      celular: String(payload.celular ?? ""),
      email: String(payload.email ?? ""),
      webSite: String(payload.webSite ?? ""),
      clasificacion: String(payload.clasificacion ?? ""),
      categoria: String(payload.categoria ?? ""),
      fechaAniversario: String(payload.fechaAniversario ?? ""),
      representanteLegal: String(payload.representanteLegal ?? ""),
      fechaNacimiento: String(payload.fechaNacimiento ?? ""),
      nota: String(payload.nota ?? ""),
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextControlled<CanalVentaDialogValues>
          name="ruc"
          control={control}
          label="RUC"
          placeholder="Ej: 20123456789"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, ruc: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="razonSocial"
          control={control}
          label="Razón social"
          placeholder="Ej: AEROMAR TRAVEL SAC"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, razonSocial: e.target.value });
          }}
        />
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="label"
            control={control}
            label="Nombre"
            placeholder="Ej: AEROMAR TRAVEL"
            required
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, label: e.target.value });
            }}
          />
        </div>
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="direccion"
            control={control}
            label="Dirección"
            placeholder="Ej: AV. PRINCIPAL 123 - LIMA"
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, direccion: e.target.value });
            }}
          />
        </div>
        <TextControlled<CanalVentaDialogValues>
          name="region"
          control={control}
          label="Región"
          placeholder="Ej: LIMA"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, region: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="contacto"
          control={control}
          label="Contacto"
          placeholder="Ej: DIANA"
          required
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, contacto: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="contacto02"
          control={control}
          label="Contacto 02"
          placeholder="Ej: MARIA"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, contacto02: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="telefono"
          control={control}
          label="Telefono"
          placeholder="Ej: 984821760"
          required
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, telefono: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="celular"
          control={control}
          label="Celular"
          placeholder="Ej: 984821760"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, celular: e.target.value });
          }}
        />
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="email"
            control={control}
            label="Email"
            type="email"
            disableAutoUppercase
            placeholder="Ej: contacto@canal.com"
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, email: e.target.value });
            }}
          />
        </div>
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="webSite"
            control={control}
            label="Web site"
            disableAutoUppercase
            placeholder="Ej: https://canal.com"
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, webSite: e.target.value });
            }}
          />
        </div>
        <TextControlled<CanalVentaDialogValues>
          name="clasificacion"
          control={control}
          label="Clasificación"
          placeholder="Ej: A"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, clasificacion: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="categoria"
          control={control}
          label="Categoría"
          placeholder="Ej: PREMIUM"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, categoria: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="fechaAniversario"
          control={control}
          label="Fecha aniversario"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          onChange={(e) => {
            setPayload({ ...payload, fechaAniversario: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="fechaNacimiento"
          control={control}
          label="Fecha nacimiento"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          onChange={(e) => {
            setPayload({ ...payload, fechaNacimiento: e.target.value });
          }}
        />
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="representanteLegal"
            control={control}
            label="Representante legal"
            placeholder="Ej: JUAN PEREZ"
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, representanteLegal: e.target.value });
            }}
          />
        </div>
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="nota"
            control={control}
            label="Nota"
            placeholder="Comentarios adicionales"
            multiline
            rows={3}
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, nota: e.target.value });
            }}
          />
        </div>
      </div>
    </form>
  );
};

const parseCanalId = (value?: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveSalesChannelId = (channel?: Partial<SalesChannelDetail>) => {
  const parsed = Number(
    channel?.idAuxiliar ?? channel?.idCanal ?? channel?.id ?? 0,
  );
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildPayload = (
  values: CanalVentaDialogValues,
  idAuxiliar: number,
): SaveSalesChannelPayload => ({
  idAuxiliar,
  auxiliar: String(values.label ?? "").trim(),
  ruc: String(values.ruc ?? "").trim(),
  razonSocial: String(values.razonSocial ?? "").trim(),
  direccion: String(values.direccion ?? "").trim(),
  region: String(values.region ?? "").trim(),
  telefono: String(values.telefono ?? "").trim(),
  celular: String(values.celular ?? "").trim(),
  contacto: String(values.contacto ?? "").trim(),
  contacto02: String(values.contacto02 ?? "").trim(),
  email: String(values.email ?? "").trim(),
  webSite: String(values.webSite ?? "").trim(),
  clasificacion: String(values.clasificacion ?? "").trim(),
  categoria: String(values.categoria ?? "").trim(),
  fechaAniversario: String(values.fechaAniversario ?? "").trim(),
  representanteLegal: String(values.representanteLegal ?? "").trim(),
  fechaNacimiento: String(values.fechaNacimiento ?? "").trim(),
  nota: String(values.nota ?? "").trim(),
});

const SalesChannelPage = () => {
  const { channels, isLoading, error, refresh, saveChannel, deleteChannel } =
    useSalesChannels();
  const openDialog = useDialogStore((state) => state.openDialog);
  const resolveAccess = useMaintenanceAccessResolver();
  const access = resolveAccess("maintenance.sales_channel");

  const openDeleteSalesChannelDialog = useCallback(
    (channel?: SalesChannelDetail) => {
      if (!access.delete) return;
      const id = resolveSalesChannelId(channel);
      if (!id) {
        showToast({
          title: "Atencion",
          description: "No se pudo determinar el canal a eliminar.",
          type: "warning",
        });
        return;
      }

      openDialog({
        title: "Autorizacion de eliminacion",
        description:
          "Confirma la eliminacion del canal. Esta accion no se puede deshacer.",
        size: "sm",
        confirmLabel: "Autorizar y eliminar",
        cancelLabel: "Cancelar",
        content: () => (
          <p className="text-sm text-slate-700">
            ¿Deseas eliminar el canal{" "}
            <span className="font-semibold">{channel?.canalNombre ?? "-"}</span>?
          </p>
        ),
        onConfirm: async () => {
          try {
            await deleteChannel(id);
            await refresh();
            queueServiciosRefresh();
            showToast({
              title: "Exito",
              description: "Canal eliminado correctamente.",
              type: "success",
            });
            return true;
          } catch (deleteError) {
            const message =
              deleteError instanceof Error
                ? deleteError.message
                : "No se pudo eliminar el canal de venta.";

            showToast({
              title: "Error",
              description: message,
              type: "error",
            });
            return false;
          }
        },
      });
    },
    [access.delete, deleteChannel, openDialog, refresh],
  );

  const openSalesChannelModal = useCallback(
    (mode: "create" | "edit", channel?: SalesChannelDetail) => {
      if (mode === "create" && !access.create) return;
      if (mode === "edit" && !access.edit) return;
      const editingValue =
        mode === "edit"
          ? String(channel?.idAuxiliar ?? channel?.idCanal ?? "")
          : "";

      openDialog({
        title: mode === "create" ? "Crear canal de venta" : "Editar canal de venta",
        description:
          mode === "create"
            ? "Crea un canal de venta sin salir del formulario."
            : "Actualiza los datos del canal de venta.",
        size: "md",
        initialPayload: {
          ruc: channel?.ruc ?? "",
          razonSocial: channel?.razonSocial ?? "",
          label: channel?.canalNombre ?? "",
          direccion: channel?.direccion ?? "",
          region: channel?.region ?? "",
          value: editingValue,
          contacto: channel?.contacto ?? "",
          contacto02: channel?.contacto02 ?? "",
          telefono: channel?.telefono ?? "",
          celular: channel?.celular ?? "",
          email: channel?.email ?? "",
          webSite: channel?.webSite ?? "",
          clasificacion: channel?.clasificacion ?? "",
          categoria: channel?.categoria ?? "",
          fechaAniversario: channel?.fechaAniversario ?? "",
          representanteLegal: channel?.representanteLegal ?? "",
          fechaNacimiento: channel?.fechaNacimiento ?? "",
          nota: channel?.nota ?? "",
          search: "",
          editingValue,
        },
        confirmLabel: "Guardar canal",
        cancelLabel: "Cancelar",
        dangerLabel: mode === "edit" && access.delete ? "Eliminar canal" : undefined,
        content: ({ payload, setPayload }) => (
          <CanalVentaDialogForm
            payload={payload as CanalVentaDialogPayload}
            setPayload={setPayload}
          />
        ),
        onDanger:
          mode === "edit" && access.delete
            ? async () => {
                openDeleteSalesChannelDialog(channel);
                return false;
              }
            : undefined,
        onConfirm: async (data) => {
          const ruc = String(data.ruc ?? "").trim();
          const razonSocial = String(data.razonSocial ?? "").trim();
          const label = String(data.label ?? "").trim();
          const direccion = String(data.direccion ?? "").trim();
          const region = String(data.region ?? "").trim();
          const contacto = String(data.contacto ?? "").trim();
          const contacto02 = String(data.contacto02 ?? "").trim();
          const telefono = String(data.telefono ?? "").trim();
          const celular = String(data.celular ?? "").trim();
          const email = String(data.email ?? "").trim();
          const webSite = String(data.webSite ?? "").trim();
          const clasificacion = String(data.clasificacion ?? "").trim();
          const categoria = String(data.categoria ?? "").trim();
          const fechaAniversario = String(data.fechaAniversario ?? "").trim();
          const representanteLegal = String(
            data.representanteLegal ?? "",
          ).trim();
          const fechaNacimiento = String(data.fechaNacimiento ?? "").trim();
          const nota = String(data.nota ?? "").trim();
          const idAuxiliar = parseCanalId(
            String(data.editingValue ?? editingValue),
          );

          if (!label) {
            showToast({
              title: "Atencion",
              description: "Ingresa el nombre del canal de venta.",
              type: "warning",
            });
            throw new Error("Nombre de canal de venta requerido");
          }

          if (!contacto) {
            showToast({
              title: "Atencion",
              description: "Ingresa el contacto del canal de venta.",
              type: "warning",
            });
            throw new Error("Contacto de canal de venta requerido");
          }

          if (!telefono) {
            showToast({
              title: "Atencion",
              description: "Ingresa el telefono del canal de venta.",
              type: "warning",
            });
            throw new Error("Telefono de canal de venta requerido");
          }

          if (email && !emailRegex.test(email)) {
            showToast({
              title: "Atencion",
              description:
                "Si ingresas correo, debe tener un formato valido con @ y .com",
              type: "warning",
            });
            throw new Error("Formato de email invalido");
          }

          try {
            const payload = buildPayload(
              {
                ruc,
                razonSocial,
                label,
                direccion,
                region,
                contacto,
                contacto02,
                telefono,
                celular,
                email,
                webSite,
                clasificacion,
                categoria,
                fechaAniversario,
                representanteLegal,
                fechaNacimiento,
                nota,
              },
              idAuxiliar,
            );
            const savedId = await saveChannel(payload);
            await refresh();
            queueServiciosRefresh();

            showToast({
              title: "Exito",
              description: `Canal guardado correctamente (ID ${savedId}).`,
              type: "success",
            });
            return true;
          } catch (saveError) {
            const message =
              saveError instanceof Error
                ? saveError.message
                : "No se pudo guardar el canal de venta.";

            showToast({
              title: "Error",
              description: message,
              type: "error",
            });
            throw saveError;
          }
        },
      });
    },
    [
      access.create,
      access.delete,
      access.edit,
      openDeleteSalesChannelDialog,
      openDialog,
      refresh,
      saveChannel,
    ],
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<SalesChannelDetail>();

    return [
      columnHelper.accessor("canalNombre", {
        header: "Canal",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("ruc", {
        header: "RUC",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("region", {
        header: "Región",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("contacto", {
        header: "Contacto",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("contacto02", {
        header: "Contacto 2",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("telefono", {
        header: "Telefono",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("celular", {
        header: "Celular",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        meta: { align: "center" },
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={!access.edit}
              onClick={(event) => {
                event.stopPropagation();
                openSalesChannelModal("edit", row.original);
              }}
              className="text-blue-600 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!access.delete}
              onClick={(event) => {
                event.stopPropagation();
                openDeleteSalesChannelDialog(row.original);
              }}
              className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-40"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ];
  }, [access.delete, access.edit, openDeleteSalesChannelDialog, openSalesChannelModal]);

  return (
    <MaintenancePageFrame
      title="Canal de venta"
      description="Registra y actualiza canales de venta para los viajes."
    >
      {error ? (
        <p className="px-1 pb-2 text-sm text-red-600">
          No se pudo cargar el listado: {error.message}
        </p>
      ) : null}

      <DndTable
        columns={columns}
        data={channels}
        isLoading={isLoading}
        enableDateFilter={false}
        emptyMessage="No hay canales cargados"
        onRowClick={(row) => openSalesChannelModal("edit", row)}
        headerAction={
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320]"
            disabled={!access.create}
            onClick={() => openSalesChannelModal("create")}
            title="Crear canal de venta"
            aria-label="Crear canal de venta"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />
    </MaintenancePageFrame>
  );
};

export default SalesChannelPage;
