import type { AuthUser } from "@/store/auth/auth.store";
import type { ModuleCode } from "./mockModulePermissions";
import { readAreaModuleActionModes } from "./areaPermissionOverrides";

export type PermissionAction = "read" | "create" | "edit" | "delete";
export type PermissionMode = "inherit" | "allow" | "deny";

export type ModuleActionModes = Record<PermissionAction, PermissionMode>;
export type UserModuleActionModes = Record<ModuleCode, ModuleActionModes>;
export type UserModuleActionPermissions = Record<
  ModuleCode,
  Record<PermissionAction, boolean>
>;

const STORAGE_KEY = "picaflor.permissions.module-actions";

export const MODULE_CODES: ModuleCode[] = [
  "fullday",
  "programacion",
  "citytour",
  "paquete_viaje",
  "cashflow",
  "maintenance",
  "security",
];

const ACTIONS: PermissionAction[] = ["read", "create", "edit", "delete"];

const emptyModes = (): ModuleActionModes => ({
  read: "inherit",
  create: "inherit",
  edit: "inherit",
  delete: "inherit",
});

const defaultModesByModule = (): UserModuleActionModes =>
  MODULE_CODES.reduce(
    (acc, code) => {
      acc[code] = emptyModes();
      return acc;
    },
    {} as UserModuleActionModes,
  );

const isPermissionMode = (value: string): value is PermissionMode =>
  value === "inherit" || value === "allow" || value === "deny";

const sanitizeModes = (value: unknown): UserModuleActionModes => {
  const result = defaultModesByModule();
  if (!value || typeof value !== "object") return result;

  MODULE_CODES.forEach((moduleCode) => {
    const rawModule = (value as Record<string, unknown>)[moduleCode];
    if (!rawModule || typeof rawModule !== "object") return;

    ACTIONS.forEach((action) => {
      const rawMode = (rawModule as Record<string, unknown>)[action];
      const mode = String(rawMode ?? "inherit");
      result[moduleCode][action] = isPermissionMode(mode) ? mode : "inherit";
    });
  });

  return result;
};

const readAllUserModes = (): Record<string, UserModuleActionModes> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed).reduce<Record<string, UserModuleActionModes>>(
      (acc, [userId, value]) => {
        acc[String(userId)] = sanitizeModes(value);
        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
};

export const readUserModuleActionModes = (userId: string): UserModuleActionModes => {
  const all = readAllUserModes();
  return all[String(userId)] ?? defaultModesByModule();
};

export const saveUserModuleActionModes = (
  userId: string,
  modes: UserModuleActionModes,
) => {
  if (typeof window === "undefined") return;
  const normalizedUserId = String(userId ?? "").trim();
  if (!normalizedUserId) return;

  const all = readAllUserModes();
  all[normalizedUserId] = sanitizeModes(modes);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

const resolveActionValue = (
  mode: PermissionMode,
  baseValue: boolean,
): boolean => {
  if (mode === "allow") return true;
  if (mode === "deny") return false;
  return baseValue;
};

export const resolveUserModuleActionPermissions = (
  user: AuthUser | null,
  allowedModules: ModuleCode[],
): UserModuleActionPermissions => {
  const userId = String(user?.id ?? "");
  const areaId = String(user?.areaId ?? user?.area ?? "");
  const areaModes = areaId
    ? readAreaModuleActionModes(areaId)
    : defaultModesByModule();
  const modes = userId ? readUserModuleActionModes(userId) : defaultModesByModule();
  const allowedSet = new Set(allowedModules);

  return MODULE_CODES.reduce((acc, moduleCode) => {
    const areaModuleModes = areaModes[moduleCode] ?? emptyModes();
    const userModuleModes = modes[moduleCode] ?? emptyModes();

    const moduleBase = allowedSet.has(moduleCode);
    const areaRead = resolveActionValue(areaModuleModes.read, moduleBase);
    const areaCreate = areaRead
      ? resolveActionValue(areaModuleModes.create, moduleBase)
      : false;
    const areaEdit = areaRead
      ? resolveActionValue(areaModuleModes.edit, moduleBase)
      : false;
    const areaDelete = areaRead
      ? resolveActionValue(areaModuleModes.delete, moduleBase)
      : false;

    const read = resolveActionValue(userModuleModes.read, areaRead);
    const create = read
      ? resolveActionValue(userModuleModes.create, areaCreate)
      : false;
    const edit = read ? resolveActionValue(userModuleModes.edit, areaEdit) : false;
    const del = read
      ? resolveActionValue(userModuleModes.delete, areaDelete)
      : false;

    acc[moduleCode] = { read, create, edit, delete: del };
    return acc;
  }, {} as UserModuleActionPermissions);
};
