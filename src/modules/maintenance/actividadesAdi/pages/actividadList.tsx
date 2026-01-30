import { useCallback, useEffect, useMemo, useRef } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

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
                  ? "La actividad se guard� correctamente."
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
      columnHelper.accessor("destino", {
        header: "Destino",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("actividad", {
        header: "Actividad",
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
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          onClick={() => openActividadModal("create")}
        >
          + Nueva actividad
        </button>
      </div>

      <DndTable
        data={actividadesAdi}
        columns={columns}
        enableDateFilter={false}
      />
    </div>
  );
};

export default ActividadAdiList;
