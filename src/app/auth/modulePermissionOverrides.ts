import type { ModuleCode } from "./mockModulePermissions";

export type ModulePermissionOverride = {
  allow?: ModuleCode[];
  deny?: ModuleCode[];
};

const STORAGE_KEY = "picaflor.permissions.module-overrides";

const isModuleCode = (value: string): value is ModuleCode =>
  [
    "fullday",
    "programacion",
    "citytour",
    "paquete_viaje",
    "cashflow",
    "maintenance",
    "security",
  ].includes(value);

const sanitizeOverride = (value: ModulePermissionOverride): ModulePermissionOverride => {
  const allow = Array.from(
    new Set((value.allow ?? []).map(String).filter(isModuleCode)),
  );
  const deny = Array.from(
    new Set((value.deny ?? []).map(String).filter(isModuleCode)),
  );

  return {
    allow,
    deny,
  };
};

export const readModulePermissionOverrides = (): Record<
  string,
  ModulePermissionOverride
> => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, ModulePermissionOverride>;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed).reduce<Record<string, ModulePermissionOverride>>(
      (acc, [userId, override]) => {
        if (!userId) return acc;
        acc[String(userId)] = sanitizeOverride(override ?? {});
        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
};

export const readUserModulePermissionOverride = (
  userId: string,
): ModulePermissionOverride => {
  const all = readModulePermissionOverrides();
  return all[String(userId)] ?? {};
};

export const saveUserModulePermissionOverride = (
  userId: string,
  override: ModulePermissionOverride,
) => {
  if (typeof window === "undefined") return;
  const normalizedUserId = String(userId ?? "").trim();
  if (!normalizedUserId) return;

  const all = readModulePermissionOverrides();
  all[normalizedUserId] = sanitizeOverride(override);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};
