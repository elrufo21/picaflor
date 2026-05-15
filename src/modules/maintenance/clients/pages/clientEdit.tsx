import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import ClientForm from "../components/ClientForm";
import { useClientsStore } from "@/store/clients/clients.store";
import type { Client } from "@/types/maintenance";

const ClientEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, fetchClients, updateClient, deleteClient } =
    useClientsStore();

  const [current, setCurrent] = useState<Client | null>(null);

  useEffect(() => {
    if (!clients.length) {
      fetchClients();
    }
  }, [clients.length, fetchClients]);

  useEffect(() => {
    const found = clients.find(
      (clientItem) => String(clientItem.clienteId) === String(id)
    );
    if (found) setCurrent(found);
  }, [clients, id]);

  if (!id) return null;
  if (!current) return <div className="p-4">Cargando cliente...</div>;

  const handleSave = async (data: Client) => {
    const ok = await updateClient(Number(id), data);
    if (!ok) {
      showToast({ title: "Error", description: "No se pudo actualizar el cliente", type: "error" });
      return;
    }
    showToast({ title: "Exito", description: "Cliente actualizado", type: "success" });
    navigate("/maintenance/clients");
  };

  const handleDelete = async () => {
    const ok = await deleteClient(Number(id));
    if (!ok) {
      showToast({ title: "Error", description: "No se pudo eliminar el cliente", type: "error" });
      return;
    }
    showToast({ title: "Exito", description: "Cliente eliminado", type: "success" });
    navigate("/maintenance/clients");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <ClientForm
        mode="edit"
        initialData={current}
        onSave={handleSave}
        onDelete={handleDelete}
        onNew={() => navigate("/maintenance/clients/create")}
      />
    </div>
  );
};

export default ClientEdit;
