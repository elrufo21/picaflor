import { useNavigate } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import HolidayForm from "@/components/maintenance/HolidayForm";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Holiday } from "@/types/maintenance";

export default function HolidayCreate() {
  const navigate = useNavigate();
  const { addHoliday } = useMaintenanceStore();

  const handleSave = async (data: Holiday) => {
    const rs = await addHoliday(data);
    if (!rs) return;
    showToast({ title: "Exito", description: "Feriado creado correctamente", type: "success" });
    navigate("/maintenance/holidays");
  };

  const handleNew = () => {
    navigate("/maintenance/holidays/create");
  };

  return <HolidayForm mode="create" onSave={handleSave} onNew={handleNew} />;
}
