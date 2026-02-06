import { useDialogStore } from "@/app/store/dialogStore";
import DndTable from "@/components/dataTabla/DndTable";
import { TextControlled } from "@/components/ui/inputs";

import { createColumnHelper } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { API_BASE_URL } from "@/config";
import {
  type SalesChannelDetail,
  useSalesChannels,
} from "../hooks/useSalesChannels";
import { showToast } from "@/components/ui/AppToast";
import { queueServiciosRefresh } from "@/app/db/serviciosSync";

type SalesChannelFormValues = {
  auxiliar: string;
  contacto: string;
  telefono: string;
  email: string;
  precio1: string;
  precio2: string;
  precio3: string;
};

const defaultFormValues: SalesChannelFormValues = {
  auxiliar: "",
  contacto: "",
  telefono: "",
  email: "",
  precio1: "0",
  precio2: "0",
  precio3: "0",
};

const SALES_CHANNEL_SAVE_ENDPOINT = `${API_BASE_URL}/Canal/guardar`;

const SalesChannelPage = () => {
  const { channels, isLoading, refresh } = useSalesChannels();
  const [mode, setMode] = useState("create");
  const [editingChannel, setEditingChannel] =
    useState<SalesChannelDetail | null>(null);

  const { openDialog } = useDialogStore();
  const { control, reset, handleSubmit } = useForm<SalesChannelFormValues>({
    defaultValues: defaultFormValues,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleNew = (options?: { clearFeedback?: boolean }) => {
    setMode("create");
    setEditingChannel(null);
    reset(defaultFormValues);
    if (options?.clearFeedback ?? true) {
      setSaveError(null);
      setSaveSuccess(null);
    }
  };

  const handleEditClick = (item: SalesChannelDetail) => {
    setMode("edit");
    setEditingChannel(item);
    reset({
      auxiliar: item.canalNombre ?? "",
      contacto: item.contacto ?? "",
      telefono: item.telefono ?? "",
      email: item.email ?? "",
      precio1: item.precio1?.toString() ?? "0",
      precio2: item.precio2?.toString() ?? "0",
      precio3: item.precio3?.toString() ?? "0",
    });
  };

  const parsePrice = (value: string) => {
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handleSave = async (values: SalesChannelFormValues) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    const payload = {
      idCanal: mode === "edit" ? (editingChannel?.idCanal ?? 0) : 0,
      region: editingChannel?.region ?? null,
      canalNombre: values.auxiliar,
      contacto: values.contacto,
      telefono: values.telefono,
      email: values.email,
      fechaNacimiento: null,
      fechaAniversario: null,
      precio1: parsePrice(values.precio1),
      precio2: parsePrice(values.precio2),
      precio3: parsePrice(values.precio3),
      fechaActualizacion: null,
      usuario: "admin",
    };

    try {
      const response = await fetch(SALES_CHANNEL_SAVE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "text/plain, application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const responseText = await response.text();
      const savedId = Number(responseText);
      const successMessage = Number.isFinite(savedId)
        ? `Canal guardado correctamente (ID ${savedId}).`
        : "Canal guardado correctamente.";
      showToast({
        title: "Exito",
        description: successMessage,
        type: "success",
      });
      setSaveSuccess(successMessage);
      if (mode === "create") {
        handleNew({ clearFeedback: false });
      } else {
        setEditingChannel((prev) =>
          prev
            ? {
                ...prev,
                canalNombre: values.auxiliar,
                contacto: values.contacto,
                telefono: values.telefono,
                email: values.email,
                precio1: parsePrice(values.precio1),
                precio2: parsePrice(values.precio2),
                precio3: parsePrice(values.precio3),
              }
            : prev,
        );
      }
      await refresh();
      queueServiciosRefresh();
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const columnHelper = createColumnHelper<SalesChannelDetail>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("canalNombre", {
        header: "Canal",
      }),
      columnHelper.accessor("region", {
        header: "Region",
        cell: (info) => info.getValue() ?? "-",
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
      columnHelper.accessor("precio1", {
        header: "Precio 1",
        cell: (info) => (info.getValue() !== undefined ? info.getValue() : "-"),
      }),
    ],
    [columnHelper],
  );

  const onDelete = () => {};

  return (
    <div className="h-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit(handleSave)}>
          <div className="bg-[#E8612A] text-white px-4 py-3 flex items-center justify-between">
            <h1 className="text-base font-semibold">
              {mode === "create"
                ? "Crear Canal de venta"
                : "Editar Canal de venta"}
            </h1>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
                title="Guardar"
                disabled={isSaving}
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Guardar</span>
              </button>

              <button
                type="button"
                onClick={handleNew}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
                title="Nuevo"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo</span>
              </button>

              {mode === "edit" && onDelete && (
                <button
                  type="button"
                  onClick={() =>
                    openDialog({
                      title: "Eliminar Canal de venta",
                      size: "sm",
                      confirmLabel: "Eliminar",
                      cancelLabel: "Cancelar",
                      onConfirm: async () => {
                        await onDelete();
                      },
                      content: () => (
                        <p className="text-sm text-slate-700">
                          Estas seguro de eliminar este Canal de venta?
                          <br />
                          Esta accion no se puede deshacer.
                        </p>
                      ),
                    })
                  }
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-red-600 hover:bg-red-700 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              )}
            </div>

            {saveError && (
              <p className="mt-2 text-sm text-red-600">{saveError}</p>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-[40%] space-y-4">
                <div className="mt-4">
                  <TextControlled
                    name="auxiliar"
                    label="Auxiliar"
                    size="small"
                    control={control}
                  />
                </div>
                <div className="mt-4">
                  <TextControlled
                    name="contacto"
                    label="Contacto"
                    size="small"
                    control={control}
                  />
                </div>
                <div className="mt-4">
                  <TextControlled
                    name="telefono"
                    label="Telefono"
                    size="small"
                    control={control}
                  />
                </div>
                <div className="mt-4">
                  <TextControlled
                    name="email"
                    label="email"
                    size="small"
                    control={control}
                  />
                </div>
                <div className="mt-4">
                  <TextControlled
                    name="precio1"
                    label="Precio 1"
                    size="small"
                    control={control}
                  />
                </div>
                <div className="mt-4">
                  <TextControlled
                    name="precio2"
                    label="Precio 2"
                    size="small"
                    control={control}
                  />
                </div>
                <div className="mt-4">
                  <TextControlled
                    name="precio3"
                    label="Precio 3"
                    size="small"
                    control={control}
                  />
                </div>
              </div>
              <div className="w-full md-w-[60%] mt-6 md:mt-0">
                <DndTable
                  enableDateFilter={false}
                  enableSearching={false}
                  columns={columns}
                  data={channels}
                  isLoading={isLoading}
                  emptyMessage="No hay canales cargados"
                  onRowClick={handleEditClick}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesChannelPage;
