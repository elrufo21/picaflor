import { useCallback, useEffect, useMemo, useRef } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import DndTable from "@/components/dataTabla/DndTable";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useAreasQuery } from "../useAreasQuery";
import type { Area } from "@/types/maintenance";
import { useDialogStore } from "@/app/store/dialogStore";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";
import AreaForm from "../components/AreaForm";

const AreaList = () => {
  const openDialog = useDialogStore((s) => s.openDialog);
  const { areas, fetchAreas, addArea, updateArea, deleteArea } = useMaintenanceStore();
  const submitAreaRef = useRef<(() => Promise<boolean>) | null>(null);

  useAreasQuery();

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const openAreaModal = useCallback(
    (mode: "create" | "edit", area?: Area) => {
      openDialog({
        title: mode === "create" ? "Crear area" : "Editar area",
        description:
          mode === "create"
            ? "Registra una nueva area para el sistema."
            : "Actualiza la informacion del area seleccionada.",
        size: "xl",
        confirmLabel: mode === "create" ? "Crear" : "Guardar",
        dangerLabel: mode === "edit" ? "Eliminar" : undefined,
        onConfirm: async () => {
          const submitForm = submitAreaRef.current;
          if (typeof submitForm !== "function") return false;
          return submitForm();
        },
        onDanger:
          mode === "edit" && area?.id
            ? async () => {
                const ok = await deleteArea(area.id);
                if (!ok) {
                  toast.error("No se pudo eliminar el area");
                  return false;
                }
                toast.success("Area eliminada");
                await fetchAreas();
                return true;
              }
            : undefined,
        content: () => (
          <AreaForm
            mode={mode}
            initialData={area}
            hideHeaderActions
            onRegisterSubmit={(submit) => {
              submitAreaRef.current = submit;
            }}
            onSave={async (data) => {
              if (mode === "create") {
                const ok = await addArea({ area: data.area });
                if (!ok) {
                  toast.error("Ya existe esta area");
                  return false;
                }
                toast.success("Area creada correctamente");
                await fetchAreas();
                return true;
              }

              if (!area?.id) return false;
              await updateArea(area.id, data);
              toast.success("Area actualizada");
              await fetchAreas();
              return true;
            }}
          />
        ),
      });
    },
    [openDialog, addArea, updateArea, deleteArea, fetchAreas],
  );

  const columnHelper = createColumnHelper<Area>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("area", {
        header: "Area",
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openAreaModal("edit", row.original)}
              className="text-blue-600 hover:text-blue-800"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                openDialog({
                  title: "Eliminar area",
                  size: "sm",
                  confirmLabel: "Eliminar",
                  cancelLabel: "Cancelar",
                  onConfirm: async () => {
                    const ok = await deleteArea(row.original.id);
                    if (!ok) {
                      toast.error("No se pudo eliminar el area");
                      return false;
                    }
                    toast.success("Area eliminada");
                    await fetchAreas();
                    return true;
                  },
                  content: () => (
                    <div>
                      Estas seguro de eliminar esta area? Esta accion no se puede
                      deshacer.
                    </div>
                  ),
                });
              }}
              className="text-red-600 hover:text-red-800"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ],
    [columnHelper, openDialog, openAreaModal, deleteArea, fetchAreas],
  );

  return (
    <MaintenancePageFrame
      title="Areas"
      description="Administra las areas internas para organizar mejor tus procesos."
      action={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#E8612A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#d55320]"
          onClick={() => openAreaModal("create")}
        >
          <Plus className="h-4 w-4" />
          Nueva area
        </button>
      }
    >
      <DndTable data={areas} columns={columns} enableDateFilter={false} />
    </MaintenancePageFrame>
  );
};

export default AreaList;
