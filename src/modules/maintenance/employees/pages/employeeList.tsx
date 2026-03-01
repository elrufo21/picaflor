import { useCallback, useEffect, useMemo, useRef } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import DndTable from "@/components/dataTabla/DndTable";
import { useEmployeesStore } from "@/store/employees/employees.store";
import type { Personal } from "@/types/employees";
import { useDialogStore } from "@/app/store/dialogStore";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";
import EmployeeForm from "../components/EmployeeForm";
import { useMaintenanceAccessResolver } from "../../permissions/useMaintenanceAccessResolver";

const EmployeeList = () => {
  const openDialog = useDialogStore((s) => s.openDialog);
  const resolveAccess = useMaintenanceAccessResolver();
  const access = resolveAccess("maintenance.employees");
  const {
    employees,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployeesStore();
  const submitEmployeeRef = useRef<(() => Promise<boolean>) | null>(null);

  useEffect(() => {
    fetchEmployees("ACTIVO");
  }, [fetchEmployees]);

  const openEmployeeModal = useCallback(
    (mode: "create" | "edit", employee?: Personal) => {
      if (mode === "create" && !access.create) return;
      if (mode === "edit" && !access.edit) return;
      openDialog({
        title: mode === "create" ? "Registrar personal" : "Editar personal",
        description:
          mode === "create"
            ? "Completa los datos para registrar un nuevo empleado."
            : "Actualiza los datos del empleado seleccionado.",
        size: "xxl",
        confirmLabel: mode === "create" ? "Crear" : "Guardar",
        dangerLabel: mode === "edit" && access.delete ? "Eliminar" : undefined,
        onConfirm: async () => {
          const submitForm = submitEmployeeRef.current;
          if (typeof submitForm !== "function") return false;
          return submitForm();
        },
        onDanger:
          mode === "edit" && access.delete
            ? async () => {
                const id = Number(employee?.personalId ?? 0);
                if (!id) return false;
                openDialog({
                  title: "Eliminar empleado",
                  size: "sm",
                  confirmLabel: "Eliminar",
                  cancelLabel: "Cancelar",
                  onConfirm: async () => {
                    const ok = await deleteEmployee(id);
                    if (!ok) {
                      toast.error(
                        "No se pudo eliminar, ya que tiene relacion con otros modulos",
                      );
                      return false;
                    }
                    toast.success("Empleado eliminado");
                    await fetchEmployees("ACTIVO");
                    return true;
                  },
                  content: () => (
                    <p className="text-sm text-slate-700">
                      Estas seguro de eliminar este empleado?
                      <br />
                      Esta accion no se puede deshacer.
                    </p>
                  ),
                });
                return false;
              }
            : undefined,
        content: () => (
          <EmployeeForm
            mode={mode}
            initialData={employee}
            hideHeaderActions
            onRegisterSubmit={(submit) => {
              submitEmployeeRef.current = submit;
            }}
            onSave={async (data) => {
              if (mode === "create") {
                const ok = await addEmployee(data);
                if (!ok) {
                  toast.error("No se pudo crear el empleado");
                  return false;
                }
                toast.success("Empleado creado correctamente");
                await fetchEmployees("ACTIVO");
                return true;
              }

              const id = Number(employee?.personalId ?? 0);
              if (!id) return false;
              const ok = await updateEmployee(id, data);
              if (!ok) {
                toast.error("No se pudo actualizar el empleado");
                return false;
              }
              toast.success("Empleado actualizado");
              await fetchEmployees("ACTIVO");
              return true;
            }}
            onNew={() => {}}
          />
        ),
      });
    },
    [
      access.create,
      access.delete,
      access.edit,
      openDialog,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      fetchEmployees,
    ],
  );

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
          <div className="flex items-center gap-3 ">
            <button
              type="button"
              disabled={!access.edit}
              onClick={() => openEmployeeModal("edit", row.original)}
              className="text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (!access.delete) return;
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
                      return false;
                    }
                    toast.success("Empleado eliminado");
                    await fetchEmployees("ACTIVO");
                    return true;
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
              disabled={!access.delete}
              className="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ],
    [
      columnHelper,
      openDialog,
      openEmployeeModal,
      deleteEmployee,
      fetchEmployees,
      access.delete,
      access.edit,
    ],
  );

  return (
    <MaintenancePageFrame
      title="Empleados"
      description="Gestiona el personal activo y su informacion principal."
    >
      <DndTable
        data={employees}
        columns={columns}
        enableDateFilter={false}
        headerAction={
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320]"
            disabled={!access.create}
            onClick={() => openEmployeeModal("create")}
            title="Nuevo empleado"
            aria-label="Nuevo empleado"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />
    </MaintenancePageFrame>
  );
};

export default EmployeeList;
