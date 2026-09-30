import { create } from "zustand";
import type { AuthUser } from "@/store/auth/auth.store";
import { readUserSubmoduleActionModes } from "@/app/auth/submodulePermissionOverrides";
import type { PermissionAction, PermissionMode } from "@/app/auth/moduleActionPermissions";
import { SUBMODULE_OPTIONS } from "@/app/auth/submoduleCatalog";

type SubmoduleActionPermissions = Record<
  string,
  Record<PermissionAction, boolean>
>;

type SubmodulePermissionsState = {
  allowedSubmodules: string[];
  submoduleActions: SubmoduleActionPermissions;
  permissionsVersion: number | null;
  loaded: boolean;
  loadForUser: (user: AuthUser | null) => void;
  clear: () => void;
  canAccessSubmodule: (submoduleCode: string) => boolean;
  canAccessSubmoduleAction: (
    submoduleCode: string,
    action: PermissionAction,
  ) => boolean;
};

const normalizeSubmoduleCode = (value: string) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";

  const parts = raw.split(".").filter(Boolean);
  if (parts.length >= 2 && parts[0] === parts[1]) {
    parts.splice(1, 1);
  }

  return parts.join(".");
};

const defaultSubmoduleActionPermissions = (): SubmoduleActionPermissions =>
  SUBMODULE_OPTIONS.reduce(
    (acc, item) => {
      const code = normalizeSubmoduleCode(item.code);
      acc[code] = {
        read: false,
        create: false,
        edit: false,
        delete: false,
      };
      return acc;
    },
    {} as SubmoduleActionPermissions,
  );

const resolveActionValue = (
  mode: PermissionMode,
  baseValue: boolean,
): boolean => {
  if (mode === "allow") return true;
  if (mode === "deny") return false;
  return baseValue;
};

export const useSubmodulePermissionsStore = create<SubmodulePermissionsState>(
  (set, get) => ({
    allowedSubmodules: [],
    submoduleActions: defaultSubmoduleActionPermissions(),
    permissionsVersion: null,
    loaded: false,

    loadForUser: (user) => {
      if (!user?.permissionsFromLogin) {
        set({
          allowedSubmodules: [],
          submoduleActions: defaultSubmoduleActionPermissions(),
          permissionsVersion: null,
          loaded: true,
        });
        return;
      }

      const unique = new Set<string>();
      (user.allowedSubmodules ?? []).forEach((rawCode) => {
        const code = normalizeSubmoduleCode(rawCode);
        if (code) unique.add(code);
      });
      const userId = String(user.id ?? "").trim();
      const userActionModes = user.id
        ? readUserSubmoduleActionModes(userId)
        : {};
      const submoduleActions = defaultSubmoduleActionPermissions();

      Object.keys(submoduleActions).forEach((submoduleCode) => {
        const baseAllowed = unique.has(submoduleCode);
        const userModes = userActionModes[submoduleCode] ?? {
          read: "inherit",
          create: "inherit",
          edit: "inherit",
          delete: "inherit",
        };

        const read = resolveActionValue(userModes.read, baseAllowed);
        const create = read
          ? resolveActionValue(userModes.create, baseAllowed)
          : false;
        const edit = read ? resolveActionValue(userModes.edit, baseAllowed) : false;
        const del = read ? resolveActionValue(userModes.delete, baseAllowed) : false;

        submoduleActions[submoduleCode] = {
          read,
          create,
          edit,
          delete: del,
        };
      });

      set({
        allowedSubmodules: Array.from(unique),
        submoduleActions,
        permissionsVersion: user.permissionsVersion ?? null,
        loaded: true,
      });
    },

    clear: () =>
      set({
        allowedSubmodules: [],
        submoduleActions: defaultSubmoduleActionPermissions(),
        permissionsVersion: null,
        loaded: false,
      }),

    canAccessSubmodule: (submoduleCode) =>
      get().allowedSubmodules.includes(normalizeSubmoduleCode(submoduleCode)),

    canAccessSubmoduleAction: (submoduleCode, action) =>
      Boolean(
        get().submoduleActions?.[normalizeSubmoduleCode(submoduleCode)]?.[action],
      ),
  }),
);
