import { useNavigate } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import AreaForm from "../components/AreaForm";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

const AreaCreate = () => {
  const navigate = useNavigate();
  const { addArea } = useMaintenanceStore();

  const handleSave = async (data: { area: string; id?: number }) => {
    const ok = await addArea({ area: data.area });
    if (!ok) {
      showToast({ title: "Error", description: "Ya existe esta area", type: "error" });
      return;
    }
    showToast({ title: "Exito", description: "Área creada correctamente", type: "success" });
  };

  return (
    <div className="p-4 sm:p-6">
      <AreaForm mode="create" onSave={handleSave} onNew={() => {}} />
    </div>
  );
};

export default AreaCreate;
