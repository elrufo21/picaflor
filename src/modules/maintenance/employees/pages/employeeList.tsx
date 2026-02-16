import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import DndTable from "@/components/dataTabla/DndTable";
import { useEmployeesStore } from "@/store/employees/employees.store";
import type { Personal } from "@/types/employees";
import { useDialogStore } from "@/app/store/dialogStore";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";

const EmployeeList = () => {
  const navigate = useNavigate();
  const openDialog = useDialogStore((s) => s.openDialog);
  const { employees, fetchEmployees, deleteEmployee } = useEmployeesStore();

  useEffect(() => {
    fetchEmployees("ACTIVO");
  }, [fetchEmployees]);

  const columnHelper = createColumnHelper<Personal>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("personalNombres", {
        header: "Nombres",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("personalApellidos", {
        header: "Apellidos",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("personalDni", {
        header: "DNI",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("personalEstado", {
        header: "Estado",
        cell: (info) => info.getValue() ?? "ACTIVO",
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(`/maintenance/employees/${row.original.personalId}/edit`)
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
                  title: "Eliminar empleado",
                  size: "sm",
                  confirmLabel: "Eliminar",
                  cancelLabel: "Cancelar",
                  onConfirm: async () => {
                    const ok = await deleteEmployee(row.original.personalId);
                    if (!ok) {
                      toast.error(
                        "No se pudo eliminar, ya que tiene relacion con otros modulos",
                      );
                    }
                  },
                  content: () => (
                    <p className="text-sm text-slate-700">
                      Estas seguro de eliminar este empleado?
                      <br />
                      Esta accion no se puede deshacer.
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
    ],
    [columnHelper, deleteEmployee, navigate, openDialog],
  );

  return (
    <MaintenancePageFrame
      title="Empleados"
      description="Gestiona el personal activo y su informacion principal."
      action={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#E8612A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#d55320]"
          onClick={() => navigate("/maintenance/employees/create")}
        >
          <Plus className="h-4 w-4" />
          Nuevo empleado
        </button>
      }
    >
      <DndTable data={employees} columns={columns} enableDateFilter={false} />
    </MaintenancePageFrame>
  );
};

export default EmployeeList;
