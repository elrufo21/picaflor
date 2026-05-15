import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import EmployeeForm from "../components/EmployeeForm";
import { useEmployeesStore } from "@/store/employees/employees.store";
import type { Personal } from "@/types/employees";

const EmployeeEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { employees, fetchEmployees, updateEmployee, deleteEmployee } =
    useEmployeesStore();

  const [current, setCurrent] = useState<Personal | null>(null);

  useEffect(() => {
    if (!employees.length) {
      fetchEmployees();
    }
  }, [employees.length, fetchEmployees]);

  useEffect(() => {
    const found = employees.find((e) => String(e.personalId) === String(id));
    if (found) setCurrent(found);
  }, [employees, id]);

  if (!id) return null;
  if (!current) return <div className="p-4">Cargando empleado...</div>;

  const handleSave = async (
    data: Personal & { imageFile?: File | null; imageRemoved?: boolean }
  ) => {
    const ok = await updateEmployee(Number(id), data);
    if (!ok) {
      showToast({ title: "Error", description: "No se pudo actualizar el empleado", type: "error" });
      return;
    }
    showToast({ title: "Exito", description: "Empleado actualizado", type: "success" });
    navigate("/maintenance/employees");
  };

  const handleDelete = async () => {
    const ok = await deleteEmployee(Number(id));
    if (!ok) {
      showToast({ title: "Error", description: "No se pudo eliminar, ya que tiene relacion con otros modulos", type: "error" });
      return;
    }
    showToast({ title: "Exito", description: "Empleado eliminado", type: "success" });
    navigate("/maintenance/employees");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <EmployeeForm
        mode="edit"
        initialData={current}
        onSave={handleSave}
        onDelete={handleDelete}
        onNew={() => navigate("/maintenance/employees/create")}
      />
    </div>
  );
};

export default EmployeeEdit;
