import { useNavigate } from "react-router";
import { showToast } from "@/components/ui/AppToast";
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
      showToast({ title: "Error", description: "Ya existe esa categoria", type: "error" });
      return;
    }
    showToast({ title: "Exito", description: "Categoría creada correctamente", type: "success" });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <CategoryForm mode="create" onSave={handleSave} onNew={() => {}} />
    </div>
  );
};

export default CategoryCreate;
