import { useCallback, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { Pencil, Plus } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { useDialogStore } from "@/app/store/dialogStore";
import { showToast } from "@/components/ui/AppToast";
import { TextControlled } from "@/components/ui/inputs";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";
import { useMaintenanceAccessResolver } from "../../permissions/useMaintenanceAccessResolver";
import {
  type SaveTransportePayload,
  type TransporteDetail,
  useTransportes,
} from "../hooks/useTransportes";

type TransporteDialogValues = {
  clasificacion: string;
  nombreTransporte: string;
  telefono: string;
  contacto: string;
  categoria: string;
  activo: "1" | "0";
};

type TransporteDialogPayload = Partial<TransporteDialogValues> & {
  value?: string;
  search?: string;
  editingValue?: string;
};

const TransporteDialogForm = ({
  payload,
  setPayload,
}: {
  payload: TransporteDialogPayload;
  setPayload: (next: Record<string, unknown>) => void;
}) => {
  const { control } = useForm<TransporteDialogValues>({
    defaultValues: {
      clasificacion: String(payload.clasificacion ?? ""),
      nombreTransporte: String(payload.nombreTransporte ?? ""),
      telefono: String(payload.telefono ?? ""),
      contacto: String(payload.contacto ?? ""),
      categoria: String(payload.categoria ?? ""),
      activo: payload.activo === "0" ? "0" : "1",
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
        <TextControlled<TransporteDialogValues>
          name="clasificacion"
          control={control}
          label="Clasificacion"
          placeholder="Ej: Terrestre"
          required
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, clasificacion: e.target.value });
          }}
        />
        <TextControlled<TransporteDialogValues>
          name="categoria"
          control={control}
          label="Categoria"
          placeholder="Ej: Bus"
          required
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, categoria: e.target.value });
          }}
        />
        <div className="md:col-span-2">
          <TextControlled<TransporteDialogValues>
            name="nombreTransporte"
            control={control}
            label="Nombre transporte"
            placeholder="Ej: Movil Tours"
            required
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, nombreTransporte: e.target.value });
            }}
          />
        </div>
        <TextControlled<TransporteDialogValues>
          name="telefono"
          control={control}
          label="Telefono"
          placeholder="Ej: 999888777"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, telefono: e.target.value });
          }}
        />
        <TextControlled<TransporteDialogValues>
          name="contacto"
          control={control}
          label="Contacto"
          placeholder="Ej: Juan Perez"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, contacto: e.target.value });
          }}
        />
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-medium text-slate-700">Activo</label>
          <select
            value={payload.activo === "0" ? "0" : "1"}
            onChange={(e) => {
              setPayload({
                ...payload,
                activo: e.target.value === "0" ? "0" : "1",
              });
            }}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
          >
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </div>
      </div>
    </form>
  );
};

const parseTransporteId = (value?: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildPayload = (
  values: TransporteDialogValues,
  idTransporte: number,
): SaveTransportePayload => ({
  idTransporte,
  clasificacion: String(values.clasificacion ?? "").trim(),
  nombreTransporte: String(values.nombreTransporte ?? "").trim(),
  telefono: String(values.telefono ?? "").trim(),
  contacto: String(values.contacto ?? "").trim(),
  categoria: String(values.categoria ?? "").trim(),
  fechaRegistro: null,
  activo: values.activo !== "0",
});

const TransportList = () => {
  const { transportes, isLoading, error, refresh, saveTransporte } =
    useTransportes();
  const openDialog = useDialogStore((state) => state.openDialog);
  const resolveAccess = useMaintenanceAccessResolver();
  const access = resolveAccess("maintenance.transport");

  const openTransportModal = useCallback(
    (mode: "create" | "edit", item?: TransporteDetail) => {
      if (mode === "create" && !access.create) return;
      if (mode === "edit" && !access.edit) return;

      const editingValue =
        mode === "edit" ? String(item?.idTransporte ?? "") : "";

      openDialog({
        title: mode === "create" ? "Crear transporte" : "Editar transporte",
        description:
          mode === "create"
            ? "Registra un nuevo proveedor de transporte."
            : "Actualiza los datos del transporte seleccionado.",
        size: "md",
        initialPayload: {
          clasificacion: item?.clasificacion ?? "",
          nombreTransporte: item?.nombreTransporte ?? "",
          telefono: item?.telefono ?? "",
          contacto: item?.contacto ?? "",
          categoria: item?.categoria ?? "",
          activo: item?.activo === false ? "0" : "1",
          value: editingValue,
          search: "",
          editingValue,
        },
        confirmLabel: "Guardar transporte",
        cancelLabel: "Cancelar",
        content: ({ payload, setPayload }) => (
          <TransporteDialogForm
            payload={payload as TransporteDialogPayload}
            setPayload={setPayload}
          />
        ),
        onConfirm: async (data) => {
          const clasificacion = String(data.clasificacion ?? "").trim();
          const nombreTransporte = String(data.nombreTransporte ?? "").trim();
          const telefono = String(data.telefono ?? "").trim();
          const contacto = String(data.contacto ?? "").trim();
          const categoria = String(data.categoria ?? "").trim();
          const activo = String(data.activo ?? "1").trim() === "0" ? "0" : "1";
          const idTransporte = parseTransporteId(
            String(data.editingValue ?? editingValue),
          );

          if (!clasificacion) {
            showToast({
              title: "Atencion",
              description: "Ingresa la clasificacion del transporte.",
              type: "warning",
            });
            throw new Error("Clasificacion requerida");
          }

          if (!nombreTransporte) {
            showToast({
              title: "Atencion",
              description: "Ingresa el nombre del transporte.",
              type: "warning",
            });
            throw new Error("Nombre de transporte requerido");
          }

          if (!categoria) {
            showToast({
              title: "Atencion",
              description: "Ingresa la categoria del transporte.",
              type: "warning",
            });
            throw new Error("Categoria requerida");
          }

          try {
            const payload = buildPayload(
              {
                clasificacion,
                nombreTransporte,
                telefono,
                contacto,
                categoria,
                activo,
              },
              idTransporte,
            );
            const savedId = await saveTransporte(payload);
            await refresh();

            showToast({
              title: "Exito",
              description: `Transporte guardado correctamente (ID ${savedId}).`,
              type: "success",
            });
            return true;
          } catch (saveError) {
            const message =
              saveError instanceof Error
                ? saveError.message
                : "No se pudo guardar el transporte.";

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
    [access.create, access.edit, openDialog, refresh, saveTransporte],
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TransporteDetail>();

    return [
      columnHelper.accessor("idTransporte", {
        header: "ID",
        cell: (info) => String(info.getValue()),
      }),
      columnHelper.accessor("clasificacion", {
        header: "Clasificacion",
        cell: (info) => info.getValue() || "-",
      }),
      columnHelper.accessor("nombreTransporte", {
        header: "Nombre",
        cell: (info) => info.getValue() || "-",
      }),
      columnHelper.accessor("telefono", {
        header: "Telefono",
        cell: (info) => info.getValue() || "-",
      }),
      columnHelper.accessor("contacto", {
        header: "Contacto",
        cell: (info) => info.getValue() || "-",
      }),
      columnHelper.accessor("categoria", {
        header: "Categoria",
        cell: (info) => info.getValue() || "-",
      }),
      columnHelper.accessor("fechaRegistro", {
        header: "Fecha registro",
        cell: (info) => info.getValue() || "-",
      }),
      columnHelper.accessor("activo", {
        header: "Estado",
        cell: (info) => (info.getValue() ? "ACTIVO" : "INACTIVO"),
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
                openTransportModal("edit", row.original);
              }}
              className="text-blue-600 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ];
  }, [access.edit, openTransportModal]);

  return (
    <MaintenancePageFrame
      title="Transporte"
      description="Registra y actualiza proveedores de transporte."
    >
      {error ? (
        <p className="px-1 pb-2 text-sm text-red-600">
          No se pudo cargar el listado: {error.message}
        </p>
      ) : null}

      <DndTable
        columns={columns}
        data={transportes}
        isLoading={isLoading}
        enableDateFilter={false}
        emptyMessage="No hay transportes cargados"
        onRowClick={(row) => {
          if (!access.edit) return;
          openTransportModal("edit", row);
        }}
        headerAction={
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320]"
            disabled={!access.create}
            onClick={() => openTransportModal("create")}
            title="Crear transporte"
            aria-label="Crear transporte"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />
    </MaintenancePageFrame>
  );
};

export default TransportList;
