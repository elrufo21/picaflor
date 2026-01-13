import type { ModuleListConfig } from "@/shared/config/listConfig";
import type { Area } from "@/types/maintenance";

export const areaListConfig: ModuleListConfig<Area> = {
  basePath: "/maintenance/areas",
  idKey: "id",
  createLabel: "Anadir area",
  deleteMessage: "Seguro que deseas eliminar esta area?",
  columns: [{ key: "area", header: "Area" }],
  filterKeys: ["area"],
};
