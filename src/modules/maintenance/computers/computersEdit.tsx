import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Computer } from "@/types/maintenance";
import ComputerForm from "@/components/maintenance/ComputerForm";
import { useDialogStore } from "@/store/app/dialog.store";

export default function ComputerEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openDialog = useDialogStore((s) => s.openDialog);
  const { computers, fetchComputers, updateComputer, deleteComputer } =
    useMaintenanceStore();

  const [initialData, setInitialData] = useState<Partial<Computer> | undefined>(
    undefined
  );

  useEffect(() => {
    if (computers.length === 0) fetchComputers();
  }, [computers, fetchComputers]);

  useEffect(() => {
    if (computers.length === 0) return;
    const comp = computers.find((c) => c.id === Number(id));
    if (comp) setInitialData(comp);
  }, [computers, id]);

  if (!initialData) return <div>Cargando computadora...</div>;

  const handleSave = async (data: Omit<Computer, "id">) => {
    const rs = await updateComputer(Number(id), data);
    if (!rs) return;
    showToast({ title: "Exito", description: "Computadora actualizada correctamente", type: "success" });
    navigate("/maintenance/computers");
  };

  const handleDelete = () => {
    if (!id) return;
    openDialog({
      title: "Eliminar",
      content: <p>Seguro que deseas eliminar esta computadora?</p>,
      onConfirm: async () => {
        try {
          const result = await deleteComputer(Number(id));
          if (result === false) {
            showToast({ title: "Error", description: "No se pudo eliminar la computadora.", type: "error" });
            return;
          }
          showToast({ title: "Exito", description: "Computadora eliminada correctamente", type: "success" });
          navigate("/maintenance/computers");
        } catch (error) {
          console.error("Error eliminando computadora", error);
          showToast({ title: "Error", description: "Ocurrio un error al eliminar la computadora.", type: "error" });
        }
      },
    });
  };

  const handleNew = () => navigate("/maintenance/computers/create");

  return (
    <ComputerForm
      mode="edit"
      initialData={initialData}
      onSave={handleSave}
      onNew={handleNew}
      onDelete={handleDelete}
    />
  );
}
