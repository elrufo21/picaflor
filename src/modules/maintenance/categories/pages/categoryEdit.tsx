import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import CategoryForm from "../components/CategoryForm";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useCategoriesQuery } from "../useCategoriesQuery";
import type { Category } from "@/types/maintenance";

const CategoryEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories, updateCategory, deleteCategory } = useMaintenanceStore();
  useCategoriesQuery(); // hydrate store

  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    const found = categories.find((c) => String(c.id) === String(id));
    if (found) setCategory(found);
  }, [categories, id]);

  if (!id) return null;
  if (!category) return <div className="p-4">Cargando categoría...</div>;

  const handleSave = async (data: Category) => {
    const ok = await updateCategory(Number(id), data);
    if (!ok) {
      toast.error("Ya existe esa categoria");
      return;
    }
    toast.success("Categoría actualizada");
    navigate("/maintenance/categories");
  };

  const handleDelete = async () => {
    const ok = await deleteCategory(Number(id));
    if (!ok) {
      toast.error("No se pudo eliminar la categoría");
      return;
    }
    toast.success("Categoría eliminada");
    navigate("/maintenance/categories");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <CategoryForm
        mode="edit"
        initialData={category}
        onSave={handleSave}
        onDelete={handleDelete}
        onNew={() => navigate("/maintenance/categories/create")}
      />
    </div>
  );
};

export default CategoryEdit;
