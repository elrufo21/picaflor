import type { AuthUser } from "@/store/auth/auth.store";
import { readUserModulePermissionOverride } from "./modulePermissionOverrides";
import { readAreaModulePermissionOverride } from "./areaPermissionOverrides";

export type ModuleCode =
  | "fullday"
  | "programacion"
  | "citytour"
  | "paquete_viaje"
  | "cashflow"
  | "maintenance"
  | "security";

export type ModulePermissionOverride = {
  allow?: ModuleCode[];
  deny?: ModuleCode[];
};

const BASE_MODULES_BY_AREA: Record<string, ModuleCode[]> = {
  // Admin / Mantenimiento
  "6": [
    "fullday",
    "programacion",
    "citytour",
    "paquete_viaje",
    "cashflow",
    "maintenance",
    "security",
  ],
  // Default comercial
  default: [
    "fullday",
    "programacion",
    "citytour",
    "paquete_viaje",
    "cashflow",
  ],
};

const USER_OVERRIDES: Record<string, ModulePermissionOverride> = {
  // Ejemplo:
  // "123": { allow: ["maintenance"] },
  // "456": { deny: ["cashflow"] },
};

export const MODULE_DEFAULT_PATHS: Record<ModuleCode, string> = {
  fullday: "/fullday",
  programacion: "/fullday/programacion/liquidaciones",
  citytour: "/citytour",
  paquete_viaje: "/paquete-viaje",
  cashflow: "/cashflow",
  maintenance: "/maintenance",
  security: "/seguridad",
};

export const resolveMockModulePermissions = (user: AuthUser | null) => {
  if (!user) return [] as ModuleCode[];

  const areaId = String(user.areaId ?? user.area ?? "").trim();
  const userId = String(user.id ?? "").trim();

  const base = BASE_MODULES_BY_AREA[areaId] ?? BASE_MODULES_BY_AREA.default;
  const areaOverride = readAreaModulePermissionOverride(areaId);
  const staticOverride = USER_OVERRIDES[userId];
  const persistedOverride = readUserModulePermissionOverride(userId);
  const override: ModulePermissionOverride = {
    allow: [
      ...(staticOverride?.allow ?? []),
      ...(persistedOverride?.allow ?? []),
    ],
    deny: [...(staticOverride?.deny ?? []), ...(persistedOverride?.deny ?? [])],
  };

  const allowed = new Set<ModuleCode>(base);

  (areaOverride?.allow ?? []).forEach((code) => allowed.add(code));
  (areaOverride?.deny ?? []).forEach((code) => allowed.delete(code));
  (override?.allow ?? []).forEach((code) => allowed.add(code));
  (override?.deny ?? []).forEach((code) => allowed.delete(code));

  return Array.from(allowed);
};
