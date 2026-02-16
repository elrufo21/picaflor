import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useCategoriesQuery } from "../useCategoriesQuery";
import type { Category } from "@/types/maintenance";
import { useDialogStore } from "@/app/store/dialogStore";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";

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
    [columnHelper, deleteCategory, navigate, openDialog],
  );

  return (
    <MaintenancePageFrame
      title="Categorias"
      description="Gestiona categorias y codigos SUNAT desde un solo lugar."
      action={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#E8612A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#d55320]"
          onClick={() => navigate("/maintenance/categories/create")}
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

