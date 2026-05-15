import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import HolidayForm from "@/components/maintenance/HolidayForm";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Holiday } from "@/types/maintenance";
import { useHolidaysQuery } from "./useHolidaysQuery";
import { useDialogStore } from "@/store/app/dialog.store";

export default function HolidayEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openDialog = useDialogStore((s) => s.openDialog);
  const { holidays, updateHoliday, deleteHoliday } = useMaintenanceStore();
  const { data = [] } = useHolidaysQuery();
  const [initialData, setInitialData] = useState<Holiday | undefined>();

  useEffect(() => {
    const source = holidays.length ? holidays : data;
    const found = source.find((h) => Number(h.id) === Number(id));
    if (found) setInitialData(found);
  }, [holidays, data, id]);

  if (!initialData) return <div>Cargando feriado...</div>;

  const handleSave = async (payload: Holiday) => {
    if (!id) return;
    const rs = await updateHoliday(Number(id), payload);
    if (!rs) return;
    showToast({ title: "Exito", description: "Feriado actualizado correctamente", type: "success" });
    navigate("/maintenance/holidays");
  };

  const handleDelete = async () => {
    if (!id) return;
    openDialog({
      title: "Eliminar",
      content: <p>Seguro que deseas eliminar este feriado?</p>,
      onConfirm: async () => {
        try {
          const result = await deleteHoliday(Number(id));
          if (result === false) {
            showToast({ title: "Error", description: "No se pudo eliminar el feriado.", type: "error" });
            return;
          }
          showToast({ title: "Exito", description: "Feriado eliminado", type: "success" });
          navigate("/maintenance/holidays");
        } catch (error) {
          console.error("Error eliminando feriado", error);
          showToast({ title: "Error", description: "Ocurrió un error al eliminar el feriado.", type: "error" });
        }
      },
    });
  };

  return (
    <HolidayForm
      mode="edit"
      initialData={initialData}
      onSave={handleSave}
      onNew={() => navigate("/maintenance/holidays/create")}
      onDelete={handleDelete}
    />
  );
}
