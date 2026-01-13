import type { ModuleListConfig } from "@/shared/config/listConfig";
import type { Category } from "@/types/maintenance";

export const categoryListConfig: ModuleListConfig<Category> = {
  basePath: "/maintenance/categories",
  idKey: "idSubLinea",
  createLabel: "Anadir categoria",
  deleteMessage: "Seguro que deseas eliminar esta categoria?",
  columns: [
    { key: "nombreSublinea", header: "Categoria" },
    { key: "codigoSunat", header: "Codigo SUNAT" },
  ],
  filterKeys: ["nombreSublinea", "codigoSunat"],
};
