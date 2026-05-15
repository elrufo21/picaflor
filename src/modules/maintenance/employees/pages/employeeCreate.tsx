import { useNavigate } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import EmployeeForm from "../components/EmployeeForm";
import { useEmployeesStore } from "@/store/employees/employees.store";
import type { Personal } from "@/types/employees";

const EmployeeCreate = () => {
  const navigate = useNavigate();
  const { addEmployee } = useEmployeesStore();

  const handleSave = async (
    data: Personal & { imageFile?: File | null; imageRemoved?: boolean }
  ) => {
    const ok = await addEmployee(data);
    if (!ok) {
      showToast({ title: "Error", description: "No se pudo crear el empleado", type: "error" });
      return;
    }
    showToast({ title: "Exito", description: "Empleado creado correctamente", type: "success" });
    navigate("/maintenance/employees");
  };

  const handleNew = () => {
    navigate("/maintenance/employees/create");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <EmployeeForm mode="create" onSave={handleSave} onNew={handleNew} />
    </div>
  );
};

export default EmployeeCreate;
