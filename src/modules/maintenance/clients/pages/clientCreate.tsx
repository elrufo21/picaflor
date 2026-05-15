import { useNavigate } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import ClientForm from "../components/ClientForm";
import { useClientsStore } from "@/store/clients/clients.store";
import type { Client } from "@/types/maintenance";

export default function ClientCreate() {
  const navigate = useNavigate();
  const { addClient } = useClientsStore();

  const handleSave = async (data: Client) => {
    const ok = await addClient(data);
    if (!ok) {
      showToast({ title: "Error", description: "No se pudo crear el cliente", type: "error" });
      return;
    }
    showToast({ title: "Exito", description: "Cliente creado correctamente", type: "success" });
  };

  const handleNew = () => {
    navigate("/maintenance/clients/create");
  };

  return <ClientForm mode="create" onSave={handleSave} onNew={handleNew} />;
}
