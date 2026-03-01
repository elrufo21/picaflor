import type { ModuleCode, ModulePermissionOverride } from "./mockModulePermissions";
import type { UserModuleActionModes } from "./moduleActionPermissions";

const MODULES_STORAGE_KEY = "picaflor.permissions.area-module-overrides";
const ACTIONS_STORAGE_KEY = "picaflor.permissions.area-module-actions";

const MODULE_CODES: ModuleCode[] = [
  "fullday",
  "programacion",
  "citytour",
  "paquete_viaje",
  "cashflow",
  "maintenance",
  "security",
];

const isModuleCode = (value: string): value is ModuleCode =>
  MODULE_CODES.includes(value as ModuleCode);

const sanitizeModuleOverride = (
  value: ModulePermissionOverride,
): ModulePermissionOverride => {
  const allow = Array.from(
    new Set((value.allow ?? []).map(String).filter(isModuleCode)),
  );
  const deny = Array.from(
    new Set((value.deny ?? []).map(String).filter(isModuleCode)),
  );

  return { allow, deny };
};

const emptyActionModes = (): UserModuleActionModes =>
  MODULE_CODES.reduce(
    (acc, moduleCode) => {
      acc[moduleCode] = {
        read: "inherit",
        create: "inherit",
        edit: "inherit",
        delete: "inherit",
      };
      return acc;
    },
    {} as UserModuleActionModes,
  );

const sanitizeActionModes = (value: unknown): UserModuleActionModes => {
  const base = emptyActionModes();
  if (!value || typeof value !== "object") return base;

  MODULE_CODES.forEach((moduleCode) => {
    const moduleEntry = (value as Record<string, unknown>)[moduleCode];
    if (!moduleEntry || typeof moduleEntry !== "object") return;

    ["read", "create", "edit", "delete"].forEach((action) => {
      const raw = (moduleEntry as Record<string, unknown>)[action];
      const normalized = String(raw ?? "inherit");
      base[moduleCode][action as "read" | "create" | "edit" | "delete"] =
        normalized === "allow" || normalized === "deny" ? normalized : "inherit";
    });
  });

  return base;
};

const readModuleOverrides = (): Record<string, ModulePermissionOverride> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MODULES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ModulePermissionOverride>;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed).reduce<Record<string, ModulePermissionOverride>>(
      (acc, [areaId, override]) => {
        acc[String(areaId)] = sanitizeModuleOverride(override ?? {});
        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
};

const readActionOverrides = (): Record<string, UserModuleActionModes> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACTIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed).reduce<Record<string, UserModuleActionModes>>(
      (acc, [areaId, modes]) => {
        acc[String(areaId)] = sanitizeActionModes(modes);
        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
};

export const readAreaModulePermissionOverride = (
  areaId: string,
): ModulePermissionOverride => {
  const all = readModuleOverrides();
  return all[String(areaId)] ?? {};
};

export const saveAreaModulePermissionOverride = (
  areaId: string,
  override: ModulePermissionOverride,
) => {
  if (typeof window === "undefined") return;
  const normalizedAreaId = String(areaId ?? "").trim();
  if (!normalizedAreaId) return;

  const all = readModuleOverrides();
  all[normalizedAreaId] = sanitizeModuleOverride(override);
  window.localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(all));
};

export const readAreaModuleActionModes = (areaId: string): UserModuleActionModes => {
  const all = readActionOverrides();
  return all[String(areaId)] ?? emptyActionModes();
};

export const saveAreaModuleActionModes = (
  areaId: string,
  modes: UserModuleActionModes,
) => {
  if (typeof window === "undefined") return;
  const normalizedAreaId = String(areaId ?? "").trim();
  if (!normalizedAreaId) return;

  const all = readActionOverrides();
  all[normalizedAreaId] = sanitizeActionModes(modes);
  window.localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(all));
};
