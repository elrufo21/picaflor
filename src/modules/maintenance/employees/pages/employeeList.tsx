import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { useEmployeesStore } from "@/store/employees/employees.store";
import type { Personal } from "@/types/employees";

const EmployeeList = () => {
  const navigate = useNavigate();
  const { employees, fetchEmployees, deleteEmployee } = useEmployeesStore();

  useEffect(() => {
    fetchEmployees("ACTIVO");
  }, [fetchEmployees]);

  const columnHelper = createColumnHelper<Personal>();
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/maintenance/employees/${row.original.personalId}/edit`
                )
              }
              className="text-blue-600 hover:text-blue-800"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={async () => {
                const confirmed = window.confirm(
                  "¿Eliminar este empleado?"
                );
                if (!confirmed) return;
                await deleteEmployee(row.original.personalId);
              }}
              className="text-red-600 hover:text-red-800"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
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
    ],
    [columnHelper, deleteEmployee, navigate]
  );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Empleados</h1>
          <p className="text-sm text-slate-600">
            Listado de empleados registrados.
          </p>
        </div>
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          onClick={() => navigate("/maintenance/employees/create")}
        >
          + Nuevo empleado
        </button>
      </div>

      <DndTable data={employees} columns={columns} enableDateFilter={false} />
    </div>
  );
};

export default EmployeeList;
