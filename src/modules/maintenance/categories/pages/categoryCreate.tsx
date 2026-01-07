import { useNavigate } from "react-router";
import { toast } from "sonner";
import CategoryForm from "../components/CategoryForm";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

const CategoryCreate = () => {
  const navigate = useNavigate();
  const { addCategory } = useMaintenanceStore();

  const handleSave = async (data: {
    nombreSublinea: string;
    codigoSunat?: string;
  }) => {
    const ok = await addCategory({
      nombreSublinea: data.nombreSublinea,
      codigoSunat: data.codigoSunat ?? "",
    });
    if (!ok) {
      toast.error("No se pudo crear la categoría");
      return;
    }
    toast.success("Categoría creada correctamente");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <CategoryForm mode="create" onSave={handleSave} onNew={() => {}} />
    </div>
  );
};

export default CategoryCreate;
