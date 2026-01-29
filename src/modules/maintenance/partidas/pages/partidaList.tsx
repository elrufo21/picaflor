import { useCallback, useEffect, useMemo, useRef } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import DndTable from "@/components/dataTabla/DndTable";
import { useDialogStore } from "@/app/store/dialogStore";
import PartidaFormDialog, {
  type PartidaFormValues,
} from "../components/PartidaFormDialog";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { usePartidasQuery } from "../usePartidasQuery";
import type { DeparturePoint } from "@/types/maintenance";

const PartidaList = () => {
  const {
    partidas,
    fetchPartidas,
    addPartida,
    updatePartida,
    deletePartida,
  } = useMaintenanceStore();
  const openDialog = useDialogStore((s) => s.openDialog);
  const formRef = useRef<UseFormReturn<PartidaFormValues> | null>(null);
  usePartidasQuery();

  useEffect(() => {
    fetchPartidas();
  }, [fetchPartidas]);

  const openPartidaModal = useCallback(
    (mode: "create" | "edit", partida?: DeparturePoint) => {
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
    [openDialog, addPartida, updatePartida],
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
              onClick={() => openPartidaModal("edit", row.original)}
              className="text-blue-600 hover:text-blue-900"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
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
              className="text-red-600 hover:text-red-800"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ];
  }, [openDialog, deletePartida, openPartidaModal]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Puntos de partida</h1>
        </div>
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          onClick={() => openPartidaModal("create")}
        >
          + Crear punto de partida
        </button>
      </div>

      <DndTable data={partidas} columns={columns} enableDateFilter={false} />
    </div>
  );
};

export default PartidaList;
