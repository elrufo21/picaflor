import { useState } from "react";
import { useNavigate } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Computer } from "@/types/maintenance";
import ComputerForm from "@/components/maintenance/ComputerForm";

const ComputerCreate = () => {
  const { addComputer } = useMaintenanceStore();
  const navigate = useNavigate();
  const [resetKey, setResetKey] = useState(() => Date.now());

  const handleSave = async (data: Omit<Computer, "id">) => {
    const rs = await addComputer(data);
    if (!rs) return;
    showToast({ title: "Exito", description: "Computadora creada correctamente", type: "success" });
    navigate("/maintenance/computers");
  };

  const handleNew = () => {
    setResetKey(Date.now());
  };

  return (
    <ComputerForm
      key={resetKey}
      mode="create"
      onSave={handleSave}
      onNew={handleNew}
    />
  );
};

export default ComputerCreate;
