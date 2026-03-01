import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router";
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
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";
import type { ModuleCode } from "@/app/auth/mockModulePermissions";
import { useMaintenanceAccessResolver } from "../../permissions/useMaintenanceAccessResolver";

const AreaList = () => {
  const location = useLocation();
  const openDialog = useDialogStore((s) => s.openDialog);
  const canAccessAction = useModulePermissionsStore((s) => s.canAccessAction);
  const resolveAccess = useMaintenanceAccessResolver();
  const { areas, fetchAreas, addArea, updateArea, deleteArea } = useMaintenanceStore();
  const submitAreaRef = useRef<(() => Promise<boolean>) | null>(null);
  const permissionModule: ModuleCode = location.pathname.startsWith("/seguridad")
    ? "security"
    : "maintenance";
  const maintenanceAccess = resolveAccess("maintenance.areas");
  const canCreate = location.pathname.startsWith("/seguridad")
    ? canAccessAction(permissionModule, "create")
    : maintenanceAccess.create;
  const canEdit = location.pathname.startsWith("/seguridad")
    ? canAccessAction(permissionModule, "edit")
    : maintenanceAccess.edit;
  const canDelete = location.pathname.startsWith("/seguridad")
    ? canAccessAction(permissionModule, "delete")
    : maintenanceAccess.delete;

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
        dangerLabel: mode === "edit" && canDelete ? "Eliminar" : undefined,
        onConfirm: async () => {
          const submitForm = submitAreaRef.current;
          if (typeof submitForm !== "function") return false;
          return submitForm();
        },
        onDanger:
          mode === "edit" && area?.id && canDelete
            ? async () => {
                openDialog({
                  title: "Eliminar area",
                  size: "sm",
                  confirmLabel: "Eliminar",
                  cancelLabel: "Cancelar",
                  onConfirm: async () => {
                    const ok = await deleteArea(area.id);
                    if (!ok) {
                      toast.error("No se pudo eliminar el area");
                      return false;
                    }
                    toast.success("Area eliminada");
                    await fetchAreas();
                    return true;
                  },
                  content: () => (
                    <p className="text-sm text-slate-700">
                      Estas seguro de eliminar esta area?
                      <br />
                      Esta accion no se puede deshacer.
                    </p>
                  ),
                });
                return false;
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
              const areaName = String(data.area ?? "").trim();
              if (!areaName) {
                toast.error("Ingrese el nombre del area");
                return false;
              }

              if (mode === "create") {
                const ok = await addArea({ area: areaName });
                if (!ok) {
                  toast.error("Ya existe esta area");
                  return false;
                }
                toast.success("Area creada correctamente");
                await fetchAreas();
                return true;
              }

              if (!area?.id) return false;
              await updateArea(area.id, {
                ...data,
                area: areaName,
              });
              toast.success("Area actualizada");
              await fetchAreas();
              return true;
            }}
          />
        ),
      });
    },
    [canDelete, openDialog, addArea, updateArea, deleteArea, fetchAreas],
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
              disabled={!canEdit}
              onClick={() => openAreaModal("edit", row.original)}
              className="text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!canDelete}
              onClick={() => {
                if (!canDelete) return;
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
              className="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ],
    [canDelete, canEdit, columnHelper, openDialog, openAreaModal, deleteArea, fetchAreas],
  );

  return (
    <MaintenancePageFrame
      title="Areas"
      description="Administra las areas internas para organizar mejor tus procesos."
    >
      <DndTable
        data={areas}
        columns={columns}
        enableDateFilter={false}
        headerAction={
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320]"
            disabled={!canCreate}
            onClick={() => openAreaModal("create")}
            title="Nueva area"
            aria-label="Nueva area"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />
    </MaintenancePageFrame>
  );
};

export default AreaList;
