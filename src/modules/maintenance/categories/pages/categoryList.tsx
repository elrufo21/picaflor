import { useCallback, useEffect, useMemo, useRef } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import DndTable from "@/components/dataTabla/DndTable";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useCategoriesQuery } from "../useCategoriesQuery";
import type { Category } from "@/types/maintenance";
import { useDialogStore } from "@/app/store/dialogStore";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";
import CategoryForm from "../components/CategoryForm";

const resolveCategoryId = (item?: Partial<Category>) =>
  Number(item?.id ?? item?.idSubLinea ?? 0);

const CategoryList = () => {
  const openDialog = useDialogStore((s) => s.openDialog);
  const { categories, fetchCategories, addCategory, updateCategory, deleteCategory } =
    useMaintenanceStore();
  const submitCategoryRef = useRef<(() => Promise<boolean>) | null>(null);

  useCategoriesQuery();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCategoryModal = useCallback(
    (mode: "create" | "edit", category?: Category) => {
      openDialog({
        title: mode === "create" ? "Crear categoria" : "Editar categoria",
        description:
          mode === "create"
            ? "Registra una nueva categoria y su codigo SUNAT."
            : "Actualiza la categoria seleccionada.",
        size: "xl",
        confirmLabel: mode === "create" ? "Crear" : "Guardar",
        dangerLabel: mode === "edit" ? "Eliminar" : undefined,
        onConfirm: async () => {
          const submitForm = submitCategoryRef.current;
          if (typeof submitForm !== "function") return false;
          return submitForm();
        },
        onDanger:
          mode === "edit"
            ? async () => {
                const id = resolveCategoryId(category);
                if (!id) return false;
                const ok = await deleteCategory(id);
                if (!ok) {
                  toast.error("No se pudo eliminar la categoria");
                  return false;
                }
                toast.success("Categoria eliminada");
                await fetchCategories();
                return true;
              }
            : undefined,
        content: () => (
          <CategoryForm
            mode={mode}
            initialData={category}
            hideHeaderActions
            onRegisterSubmit={(submit) => {
              submitCategoryRef.current = submit;
            }}
            onSave={async (data) => {
              if (mode === "create") {
                const ok = await addCategory({
                  nombreSublinea: data.nombreSublinea,
                  codigoSunat: data.codigoSunat ?? "",
                });
                if (!ok) {
                  toast.error("Ya existe esa categoria");
                  return false;
                }
                toast.success("Categoria creada correctamente");
                await fetchCategories();
                return true;
              }

              const id = resolveCategoryId(category);
              if (!id) return false;
              const ok = await updateCategory(id, data);
              if (!ok) {
                toast.error("Ya existe esa categoria");
                return false;
              }
              toast.success("Categoria actualizada");
              await fetchCategories();
              return true;
            }}
            onNew={() => {}}
          />
        ),
      });
    },
    [
      openDialog,
      addCategory,
      updateCategory,
      deleteCategory,
      fetchCategories,
    ],
  );

  const columnHelper = createColumnHelper<Category>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("nombreSublinea", {
        header: "Categoria",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("codigoSunat", {
        header: "Codigo SUNAT",
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const id = resolveCategoryId(row.original);
          return (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openCategoryModal("edit", row.original)}
                className="text-blue-600 hover:text-blue-800"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!id) return;
                  openDialog({
                    title: "Eliminar categoria",
                    size: "sm",
                    confirmLabel: "Eliminar",
                    cancelLabel: "Cancelar",
                    onConfirm: async () => {
                      const ok = await deleteCategory(id);
                      if (!ok) {
                        toast.error("No se pudo eliminar la categoria");
                        return false;
                      }
                      toast.success("Categoria eliminada");
                      await fetchCategories();
                      return true;
                    },
                    content: () => (
                      <p className="text-sm text-slate-700">
                        Estas seguro de eliminar esta categoria?
                        <br />
                        Esta accion no se puede deshacer.
                      </p>
                    ),
                  });
                }}
                className="text-red-600 hover:text-red-800"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        },
      }),
    ],
    [columnHelper, openDialog, openCategoryModal, deleteCategory, fetchCategories],
  );

  return (
    <MaintenancePageFrame
      title="Categorias"
      description="Gestiona categorias y codigos SUNAT desde un solo lugar."
      action={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#E8612A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#d55320]"
          onClick={() => openCategoryModal("create")}
        >
          <Plus className="h-4 w-4" />
          Nueva categoria
        </button>
      }
    >
      <DndTable data={categories} columns={columns} enableDateFilter={false} />
    </MaintenancePageFrame>
  );
};

export default CategoryList;
