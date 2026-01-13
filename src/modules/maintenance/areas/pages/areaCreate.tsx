import { useNavigate } from "react-router";
import { toast } from "sonner";
import AreaForm from "../components/AreaForm";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

const AreaCreate = () => {
  const navigate = useNavigate();
  const { addArea } = useMaintenanceStore();

  const handleSave = async (data: { area: string; id?: number }) => {
    const ok = await addArea({ area: data.area });
    if (!ok) {
      toast.error("Ya existe esta area");
      return;
    }
    toast.success("Área creada correctamente");
  };

  return (
    <div className="p-4 sm:p-6">
      <AreaForm mode="create" onSave={handleSave} onNew={() => {}} />
    </div>
  );
};

export default AreaCreate;
