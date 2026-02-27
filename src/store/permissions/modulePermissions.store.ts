import { create } from "zustand";
import {
  MODULE_DEFAULT_PATHS,
  resolveMockModulePermissions,
  type ModuleCode,
} from "@/app/auth/mockModulePermissions";
import { readUserModulePermissionOverride } from "@/app/auth/modulePermissionOverrides";
import {
  resolveUserModuleActionPermissions,
  type PermissionAction,
  type UserModuleActionPermissions,
} from "@/app/auth/moduleActionPermissions";
import type { AuthUser } from "@/store/auth/auth.store";

const isModuleCode = (value: string): value is ModuleCode =>
  value in MODULE_DEFAULT_PATHS;

const resolveAllowedModulesFromLogin = (user: AuthUser | null): ModuleCode[] => {
  if (!user?.permissionsFromLogin) return [];

  const unique = new Set<ModuleCode>();
  (user.allowedModules ?? []).forEach((rawCode) => {
    const code = String(rawCode ?? "").trim().toLowerCase();
    if (isModuleCode(code)) unique.add(code);
  });

  return Array.from(unique);
};

const applyUserOverride = (
  user: AuthUser | null,
  baseModules: ModuleCode[],
): ModuleCode[] => {
  const userId = String(user?.id ?? "").trim();
  if (!userId) return baseModules;

  const override = readUserModulePermissionOverride(userId);
  const result = new Set<ModuleCode>(baseModules);
  (override.allow ?? []).forEach((code) => result.add(code));
  (override.deny ?? []).forEach((code) => result.delete(code));

  return Array.from(result);
};

type ModulePermissionsState = {
  allowedModules: ModuleCode[];
  moduleActions: UserModuleActionPermissions;
  loaded: boolean;
  loadForUser: (user: AuthUser | null) => void;
  clear: () => void;
  canAccessModule: (moduleCode: ModuleCode) => boolean;
  canAccessAction: (moduleCode: ModuleCode, action: PermissionAction) => boolean;
  getFirstAllowedPath: () => string | null;
};

export const useModulePermissionsStore = create<ModulePermissionsState>(
  (set, get) => ({
    allowedModules: [],
    moduleActions: resolveUserModuleActionPermissions(null, []),
    loaded: false,

    loadForUser: (user) => {
      const modulesFromLogin = resolveAllowedModulesFromLogin(user);
      const resolvedBaseModules =
        user?.permissionsFromLogin
          ? modulesFromLogin
          : resolveMockModulePermissions(user);
      const allowedModules = applyUserOverride(user, resolvedBaseModules);
      const moduleActions = resolveUserModuleActionPermissions(user, allowedModules);
      set({ allowedModules, moduleActions, loaded: true });
    },

    clear: () =>
      set({
        allowedModules: [],
        moduleActions: resolveUserModuleActionPermissions(null, []),
        loaded: false,
      }),

    canAccessModule: (moduleCode) =>
      get().allowedModules.includes(moduleCode),

    canAccessAction: (moduleCode, action) =>
      Boolean(get().moduleActions?.[moduleCode]?.[action]),

    getFirstAllowedPath: () => {
      const [first] = get().allowedModules;
      return first ? MODULE_DEFAULT_PATHS[first] : null;
    },
  }),
);
