import { useNavigate } from "react-router";
import { toast } from "sonner";
import EmployeeForm from "../components/EmployeeForm";
import { useEmployeesStore } from "@/store/employees/employees.store";
import type { Personal } from "@/types/employees";

const EmployeeCreate = () => {
  const navigate = useNavigate();
  const { addEmployee } = useEmployeesStore();

  const handleSave = async (
    data: Personal & { imageFile?: File | null; imageRemoved?: boolean }
  ) => {
    const created = await addEmployee(data);
    if (!created) {
      toast.error("No se pudo crear el empleado");
      return;
    }
    toast.success("Empleado creado correctamente");
    navigate("/maintenance/employees");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <EmployeeForm mode="create" onSave={handleSave} onNew={() => {}} />
    </div>
  );
};

export default EmployeeCreate;
