import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import AreaForm from "../components/AreaForm";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useAreasQuery } from "../useAreasQuery";
import type { Area } from "@/types/maintenance";

const AreaEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { areas, fetchAreas, updateArea, deleteArea } = useMaintenanceStore();
  useAreasQuery(); // hydrate store

  const [area, setArea] = useState<Area | null>(null);

  useEffect(() => {
    if (!areas.length) {
      fetchAreas();
    }
  }, [areas.length, fetchAreas]);

  useEffect(() => {
    const found = areas.find((a) => String(a.id) === String(id));
    if (found) setArea(found);
  }, [areas, id]);

  if (!id) return null;
  if (!area) return <div className="p-4">Cargando área...</div>;

  const handleSave = async (data: Area) => {
    await updateArea(Number(id), data);
    showToast({ title: "Exito", description: "Ya existe esta area", type: "success" });
    navigate("/maintenance/areas");
  };

  const handleDelete = async () => {
    const ok = await deleteArea(Number(id));
    if (!ok) {
      showToast({ title: "Error", description: "No se pudo eliminar el área", type: "error" });
      return;
    }
    showToast({ title: "Exito", description: "Área eliminada", type: "success" });
    navigate("/maintenance/areas");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <AreaForm
        mode="edit"
        initialData={area}
        onSave={handleSave}
        onDelete={handleDelete}
        onNew={() => navigate("/maintenance/areas/create")}
      />
    </div>
  );
};

export default AreaEdit;
