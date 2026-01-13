import { useNavigate } from "react-router";
import { toast } from "sonner";
import ClientForm from "../components/ClientForm";
import { useClientsStore } from "@/store/clients/clients.store";
import type { Client } from "@/types/maintenance";

export default function ClientCreate() {
  const navigate = useNavigate();
  const { addClient } = useClientsStore();

  const handleSave = async (data: Client) => {
    const ok = await addClient(data);
    if (!ok) {
      toast.error("No se pudo crear el cliente");
      return;
    }
    toast.success("Cliente creado correctamente");
  };

  const handleNew = () => {
    navigate("/maintenance/clients/create");
  };

  return <ClientForm mode="create" onSave={handleSave} onNew={handleNew} />;
}
