import { useCallback, useEffect, useMemo, useRef } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import DndTable from "@/components/dataTabla/DndTable";
import { useDialogStore } from "@/app/store/dialogStore";
import PartidaFormDialog, {
  type PartidaFormValues,
} from "../components/PartidaFormDialog";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { usePartidasQuery } from "../usePartidasQuery";
import type { DeparturePoint } from "@/types/maintenance";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";
import { useMaintenanceAccessResolver } from "../../permissions/useMaintenanceAccessResolver";

const PartidaList = () => {
  const {
    partidas,
    fetchPartidas,
    addPartida,
    updatePartida,
    deletePartida,
  } = useMaintenanceStore();
  const openDialog = useDialogStore((s) => s.openDialog);
  const resolveAccess = useMaintenanceAccessResolver();
  const access = resolveAccess("maintenance.partidas");
  const formRef = useRef<UseFormReturn<PartidaFormValues> | null>(null);
  usePartidasQuery();

  useEffect(() => {
    fetchPartidas();
  }, [fetchPartidas]);

  const openPartidaModal = useCallback(
    (mode: "create" | "edit", partida?: DeparturePoint) => {
      if (mode === "create" && !access.create) return;
      if (mode === "edit" && !access.edit) return;
      openDialog({
        title:
          mode === "create"
            ? "Crear punto de partida"
            : "Editar punto de partida",
        description:
          mode === "create"
            ? "Registro de nuevos puntos antes de salir."
            : "Actualiza los campos del punto seleccionado.",
        size: "md",
        confirmLabel: mode === "create" ? "Crear punto" : "Guardar cambios",
        content: () => (
          <PartidaFormDialog formRef={formRef} initialData={partida} />
        ),
        onConfirm: () => {
          if (!formRef.current) return;
          return formRef.current.handleSubmit(async (values) => {
            if (mode === "edit" && partida) {
              await updatePartida(partida.id, values);
            } else {
              await addPartida(values);
            }
          })();
        },
      });
    },
    [access.create, access.edit, openDialog, addPartida, updatePartida],
  );

  const columns = useMemo(() => {
    const helper = createColumnHelper<DeparturePoint>();
    return [
      helper.accessor("pointName", {
        header: "Punto de partida",
        cell: (info) => info.getValue(),
      }),
      helper.accessor("destination", {
        header: "Destino",
        cell: (info) => info.getValue(),
      }),

      helper.accessor("horaPartida", {
        header: "Hora de partida",
        cell: (info) => info.getValue(),
      }),

      helper.display({
        id: "acciones",
        header: "Acciones",
        meta: { align: "center" },
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={!access.edit}
              onClick={() => openPartidaModal("edit", row.original)}
              className="text-blue-600 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!access.delete) return;
                openDialog({
                  title: "Eliminar punto de partida",
                  description:
                    "¿Estás seguro de eliminar este punto de partida? Esta acción no se puede deshacer.",
                  size: "sm",
                  confirmLabel: "Eliminar",
                  cancelLabel: "Cancelar",
                  onConfirm: async () => {
                    await deletePartida(row.original.id);
                  },
                  content: () => (
                    <p className="text-sm text-slate-700">
                      Una vez eliminado, este punto ya no podrá usarse.
                    </p>
                  ),
                });
              }}
              disabled={!access.delete}
              className="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ];
  }, [access.delete, access.edit, openDialog, deletePartida, openPartidaModal]);

  return (
    <MaintenancePageFrame
      title="Puntos de partida"
      description="Registra y actualiza los puntos de salida para cada destino."
    >
      <DndTable
        data={partidas}
        columns={columns}
        enableDateFilter={false}
        headerAction={
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320]"
            disabled={!access.create}
            onClick={() => openPartidaModal("create")}
            title="Crear punto de partida"
            aria-label="Crear punto de partida"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />
    </MaintenancePageFrame>
  );
};

export default PartidaList;
