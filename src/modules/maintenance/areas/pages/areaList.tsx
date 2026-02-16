import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useAreasQuery } from "../useAreasQuery";
import type { Area } from "@/types/maintenance";
import { useDialogStore } from "@/app/store/dialogStore";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";

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
                  title: "Eliminar area",
                  size: "sm",
                  confirmLabel: "Eliminar",
                  cancelLabel: "Cancelar",
                  onConfirm: async () => {
                    await deleteArea(row.original.id);
                  },
                  content: () => (
                    <div>
                      Estas seguro de eliminar esta area? Esta accion no se
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
    [columnHelper, deleteArea, navigate, openDialog],
  );

  return (
    <MaintenancePageFrame
      title="Areas"
      description="Administra las areas internas para organizar mejor tus procesos."
      action={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#E8612A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#d55320]"
          onClick={() => navigate("/maintenance/areas/create")}
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
