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

const emailRegex = /^[^\s@]+@[^\s@]+\.com$/i;

type CanalVentaDialogValues = {
  label: string;
  contacto: string;
  telefono: string;
  email: string;
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
      label: String(payload.label ?? ""),
      contacto: String(payload.contacto ?? ""),
      telefono: String(payload.telefono ?? ""),
      email: String(payload.email ?? ""),
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
      </div>
    </form>
  );
};

const parseCanalId = (value?: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveSalesChannelId = (channel?: Partial<SalesChannelDetail>) => {
  const parsed = Number(channel?.idCanal ?? channel?.id ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildPayload = (
  values: CanalVentaDialogValues,
  idAuxiliar: number,
): SaveSalesChannelPayload => ({
  idAuxiliar,
  auxiliar: String(values.label ?? "").trim(),
  telefono: String(values.telefono ?? "").trim(),
  contacto: String(values.contacto ?? "").trim(),
  email: String(values.email ?? "").trim(),
});

const SalesChannelPage = () => {
  const { channels, isLoading, error, refresh, saveChannel, deleteChannel } =
    useSalesChannels();
  const openDialog = useDialogStore((state) => state.openDialog);

  const openDeleteSalesChannelDialog = useCallback(
    (channel?: SalesChannelDetail) => {
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
    [deleteChannel, openDialog, refresh],
  );

  const openSalesChannelModal = useCallback(
    (mode: "create" | "edit", channel?: SalesChannelDetail) => {
      const editingValue =
        mode === "edit" ? String(channel?.idCanal ?? "") : "";

      openDialog({
        title: mode === "create" ? "Crear canal de venta" : "Editar canal de venta",
        description:
          mode === "create"
            ? "Crea un canal de venta sin salir del formulario."
            : "Actualiza los datos del canal de venta.",
        size: "md",
        initialPayload: {
          label: channel?.canalNombre ?? "",
          value: editingValue,
          contacto: channel?.contacto ?? "",
          telefono: channel?.telefono ?? "",
          email: channel?.email ?? "",
          search: "",
          editingValue,
        },
        confirmLabel: "Guardar canal",
        cancelLabel: "Cancelar",
        dangerLabel: mode === "edit" ? "Eliminar canal" : undefined,
        content: ({ payload, setPayload }) => (
          <CanalVentaDialogForm
            payload={payload as CanalVentaDialogPayload}
            setPayload={setPayload}
          />
        ),
        onDanger:
          mode === "edit"
            ? async () => {
                openDeleteSalesChannelDialog(channel);
                return false;
              }
            : undefined,
        onConfirm: async (data) => {
          const label = String(data.label ?? "").trim();
          const contacto = String(data.contacto ?? "").trim();
          const telefono = String(data.telefono ?? "").trim();
          const email = String(data.email ?? "").trim();
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
              { label, contacto, telefono, email },
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
    [openDeleteSalesChannelDialog, openDialog, refresh, saveChannel],
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<SalesChannelDetail>();

    return [
      columnHelper.accessor("canalNombre", {
        header: "Canal",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("contacto", {
        header: "Contacto",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("telefono", {
        header: "Telefono",
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
              onClick={(event) => {
                event.stopPropagation();
                openSalesChannelModal("edit", row.original);
              }}
              className="text-blue-600 hover:text-blue-900"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openDeleteSalesChannelDialog(row.original);
              }}
              className="text-red-600 hover:text-red-900"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ];
  }, [openDeleteSalesChannelDialog, openSalesChannelModal]);

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
