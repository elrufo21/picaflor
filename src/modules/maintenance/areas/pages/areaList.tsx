import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useAreasQuery } from "../useAreasQuery";
import type { Area } from "@/types/maintenance";
import { useDialogStore } from "@/app/store/dialogStore";

const AreaList = () => {
  const navigate = useNavigate();
  const openDialog = useDialogStore((s) => s.openDialog);
  const { areas, fetchAreas, deleteArea } = useMaintenanceStore();
  useAreasQuery(); // hydrate store via React Query

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const columnHelper = createColumnHelper<Area>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("area", {
        header: "Área",
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(`/maintenance/areas/${row.original.id}/edit`)
              }
              className="text-blue-600 hover:text-blue-800"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                openDialog({
                  title: "Eliminar área",

                  size: "sm",
                  confirmLabel: "Eliminar",
                  cancelLabel: "Cancelar",
                  onConfirm: async () => {
                    await deleteArea(row.original.id);
                  },
                  content: () => (
                    <div>
                      ¿Estás seguro de eliminar esta área? Esta acción no se
                      puede deshacer.
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
    [columnHelper, deleteArea, navigate, openDialog]
  );
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Áreas</h1>
          <p className="text-sm text-slate-600">
            Listado de áreas registradas.
          </p>
        </div>
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          onClick={() => navigate("/maintenance/areas/create")}
        >
          + Nueva área
        </button>
      </div>

      <DndTable data={areas} columns={columns} enableDateFilter={false} />
    </div>
  );
};

export default AreaList;
