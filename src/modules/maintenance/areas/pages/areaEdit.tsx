import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
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
    toast.success("Ya existe esta area");
    navigate("/maintenance/areas");
  };

  const handleDelete = async () => {
    const ok = await deleteArea(Number(id));
    if (!ok) {
      toast.error("No se pudo eliminar el área");
      return;
    }
    toast.success("Área eliminada");
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
