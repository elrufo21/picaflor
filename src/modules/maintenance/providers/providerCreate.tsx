import { useNavigate } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import ProviderForm from "@/components/maintenance/ProviderForm";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Provider, ProviderBankAccount } from "@/types/maintenance";

export default function ProviderCreate() {
  const navigate = useNavigate();
  const { addProvider } = useMaintenanceStore();

  const handleSave = async (
    data: Provider & { cuentasBancarias?: ProviderBankAccount[] }
  ) => {
    const rs = await addProvider(data);
    if (!rs) {
      return;
    }
    showToast({ title: "Exito", description: "Proveedor creado correctamente", type: "success" });
  };

  const handleNew = () => {
    navigate("/maintenance/providers/create");
  };

  return <ProviderForm mode="create" onSave={handleSave} onNew={handleNew} />;
}
