import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useCategoriesQuery } from "../useCategoriesQuery";
import type { Category } from "@/types/maintenance";
import { useDialogStore } from "@/app/store/dialogStore";

const CategoryList = () => {
  const navigate = useNavigate();
  const openDialog = useDialogStore((s) => s.openDialog);

  const { categories, fetchCategories, deleteCategory } = useMaintenanceStore();

  useCategoriesQuery(); // hydrate store

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const columnHelper = createColumnHelper<Category>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("nombreSublinea", {
        header: "Categoría",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("codigoSunat", {
        header: "Código SUNAT",
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const id = row.original.id ?? row.original.idSubLinea;

          return (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/maintenance/categories/${id}/edit`)}
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
                    title: "Eliminar categoría",
                    size: "sm",
                    confirmLabel: "Eliminar",
                    cancelLabel: "Cancelar",
                    onConfirm: async () => {
                      await deleteCategory(Number(id));
                    },
                    content: () => (
                      <p className="text-sm text-slate-700">
                        ¿Estás seguro de eliminar esta categoría?
                        <br />
                        Esta acción no se puede deshacer.
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
    [columnHelper, deleteCategory, navigate, openDialog]
  );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Categorías</h1>
          <p className="text-sm text-slate-600">
            Listado de categorías registradas.
          </p>
        </div>

        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          onClick={() => navigate("/maintenance/categories/create")}
        >
          + Nueva categoría
        </button>
      </div>

      <DndTable data={categories} columns={columns} enableDateFilter={false} />
    </div>
  );
};

export default CategoryList;
