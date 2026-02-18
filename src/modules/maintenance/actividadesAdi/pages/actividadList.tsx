import { useCallback, useEffect, useMemo, useRef } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { useDialogStore } from "@/app/store/dialogStore";
import { showToast } from "@/components/ui/AppToast";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import ActividadFormDialog, {
  buildActividadPayload,
  type ActividadFormValues,
} from "../components/ActividadFormDialog";
import type { ActividadAdi } from "@/types/maintenance";
import type { UseFormReturn } from "react-hook-form";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";

const columnHelper = createColumnHelper<ActividadAdi>();

const ActividadAdiList = () => {
  const actividadesAdi = useMaintenanceStore((state) => state.actividadesAdi);
  const fetchActividadesAdi = useMaintenanceStore(
    (state) => state.fetchActividadesAdi,
  );
  const addActividadAdi = useMaintenanceStore((state) => state.addActividadAdi);
  const updateActividadAdi = useMaintenanceStore(
    (state) => state.updateActividadAdi,
  );
  const deleteActividadAdi = useMaintenanceStore(
    (state) => state.deleteActividadAdi,
  );
  const products = useMaintenanceStore((state) => state.products);
  const fetchProducts = useMaintenanceStore((state) => state.fetchProducts);
  const openDialog = useDialogStore((state) => state.openDialog);
  const formRef = useRef<UseFormReturn<ActividadFormValues> | null>(null);

  useEffect(() => {
    fetchActividadesAdi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (products.length) return;
    fetchProducts();
  }, [products.length, fetchProducts]);

  const openActividadModal = useCallback(
    (mode: "create" | "edit", actividad?: ActividadAdi) => {
      if (formRef.current) {
        formRef.current.reset();
      }
      openDialog({
        title: mode === "create" ? "Nueva actividad" : "Editar actividad",
        description:
          mode === "create"
            ? "Registra una actividad adicional para un producto."
            : "Actualiza la información de la actividad seleccionada.",
        size: "lg",
        confirmLabel: mode === "create" ? "Crear" : "Guardar",
        cancelLabel: "Cancelar",
        content: () => (
          <ActividadFormDialog
            formRef={formRef}
            initialData={actividad}
            products={products}
          />
        ),
        onConfirm: () => {
          if (!formRef.current) return;
          return formRef.current.handleSubmit(async (values) => {
            formRef.current?.clearErrors(["productoId", "actividad"]);
            const missingFields: string[] = [];
            const productoId = String(values.productoId ?? "").trim();
            const actividadNombre = String(values.actividad ?? "").trim();

            if (mode === "create" && !productoId) {
              formRef.current?.setError("productoId", {
                type: "required",
                message: "Destino es obligatorio.",
              });
              missingFields.push("Destino");
            }

            if (mode === "create" && !actividadNombre) {
              formRef.current?.setError("actividad", {
                type: "required",
                message: "Actividad es obligatoria.",
              });
              missingFields.push("Actividad");
            }

            if (missingFields.length > 0) {
              formRef.current?.setFocus(
                !productoId ? "productoId" : "actividad",
              );
              showToast({
                title: "Campos obligatorios",
                description: `Completa: ${missingFields.join(", ")}.`,
                type: "warning",
              });
              throw new Error("Faltan campos obligatorios de actividad");
            }

            const selectedProduct = products.find(
              (product) => String(product.id) === values.productoId,
            );
            const payload = buildActividadPayload(
              values,
              selectedProduct,
              actividad,
            );
            const destinoLabel =
              selectedProduct?.descripcion ??
              selectedProduct?.codigo ??
              actividad?.destino ??
              "";
            const success = await (mode === "edit"
              ? updateActividadAdi(payload, destinoLabel)
              : addActividadAdi(payload, destinoLabel));
            if (!success) {
              throw new Error("No se pudo guardar la actividad");
            }
            showToast({
              title:
                mode === "create"
                  ? "Actividad registrada"
                  : "Actividad actualizada",
              description:
                mode === "create"
                  ? "La actividad se guardo correctamente."
                  : "Los cambios se guardaron correctamente.",
              type: "success",
            });
          })();
        },
      });
    },
    [openDialog, products, addActividadAdi, updateActividadAdi],
  );

  const handleDeleteActividad = useCallback(
    (actividad: ActividadAdi) => {
      if (!actividad?.id) return;
      openDialog({
        title: "Eliminar actividad adicional",
        size: "sm",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        onConfirm: async () => {
          const success = await deleteActividadAdi(actividad.id);
          if (!success) {
            showToast({
              title: "No se pudo eliminar la actividad",
              description: "Revisa tu conexión e intentalo nuevamente.",
              type: "error",
            });
            throw new Error("No se pudo eliminar la actividad");
          }
        },
        content: () => (
          <p className="text-sm text-slate-700">
            ¿Eliminar {actividad.actividad} del destino {actividad.destino}?
          </p>
        ),
      });
    },
    [deleteActividadAdi, openDialog],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("actividad", {
        header: "Actividad",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("destino", {
        header: "Destino",
        cell: (info) => info.getValue(),
      }),

      columnHelper.accessor("precioSol", {
        header: "Precio S/",
        cell: (info) => info.getValue().toString(),
      }),
      columnHelper.accessor("entradaSol", {
        header: "Entrada S/",
        cell: (info) => info.getValue().toString(),
      }),
      columnHelper.accessor("precioDol", {
        header: "Precio USD",
        cell: (info) => info.getValue().toString(),
      }),
      columnHelper.accessor("entradaDol", {
        header: "Entrada USD",
        cell: (info) => info.getValue().toString(),
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        meta: { align: "center" },
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
              onClick={() => openActividadModal("edit", row.original)}
            >
              <Pencil className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              className="text-red-600 hover:text-red-800 flex items-center gap-1"
              onClick={() => handleDeleteActividad(row.original)}
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          </div>
        ),
      }),
    ],
    [openActividadModal, handleDeleteActividad],
  );

  return (
    <MaintenancePageFrame
      title="Actividades adicionales"
      description="Configura actividades extra y sus precios para cada producto."
    >
      <DndTable
        data={actividadesAdi}
        columns={columns}
        enableDateFilter={false}
        headerAction={
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320]"
            onClick={() => openActividadModal("create")}
            title="Nueva actividad"
            aria-label="Nueva actividad"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />
    </MaintenancePageFrame>
  );
};

export default ActividadAdiList;
