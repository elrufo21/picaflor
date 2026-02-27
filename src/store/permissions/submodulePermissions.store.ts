import { create } from "zustand";
import type { AuthUser } from "@/store/auth/auth.store";
import { readAreaSubmodulePermissionOverride } from "@/app/auth/areaSubmodulePermissionOverrides";
import { readUserSubmodulePermissionOverride } from "@/app/auth/submodulePermissionOverrides";

type SubmodulePermissionsState = {
  allowedSubmodules: string[];
  permissionsVersion: number | null;
  loaded: boolean;
  loadForUser: (user: AuthUser | null) => void;
  clear: () => void;
  canAccessSubmodule: (submoduleCode: string) => boolean;
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

export const useSubmodulePermissionsStore = create<SubmodulePermissionsState>(
  (set, get) => ({
    allowedSubmodules: [],
    permissionsVersion: null,
    loaded: false,

    loadForUser: (user) => {
      if (!user?.permissionsFromLogin) {
        set({
          allowedSubmodules: [],
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
      const areaId = String(user.areaId ?? user.area ?? "").trim();
      const userId = String(user.id ?? "").trim();

      const areaOverride = areaId
        ? readAreaSubmodulePermissionOverride(areaId)
        : {};
      (areaOverride.allow ?? []).forEach((rawCode) => {
        const code = normalizeSubmoduleCode(rawCode);
        if (code) unique.add(code);
      });
      (areaOverride.deny ?? []).forEach((rawCode) => {
        const code = normalizeSubmoduleCode(rawCode);
        if (code) unique.delete(code);
      });

      const userOverride = userId
        ? readUserSubmodulePermissionOverride(userId)
        : {};
      (userOverride.allow ?? []).forEach((rawCode) => {
        const code = normalizeSubmoduleCode(rawCode);
        if (code) unique.add(code);
      });
      (userOverride.deny ?? []).forEach((rawCode) => {
        const code = normalizeSubmoduleCode(rawCode);
        if (code) unique.delete(code);
      });

      set({
        allowedSubmodules: Array.from(unique),
        permissionsVersion: user.permissionsVersion ?? null,
        loaded: true,
      });
    },

    clear: () =>
      set({
        allowedSubmodules: [],
        permissionsVersion: null,
        loaded: false,
      }),

    canAccessSubmodule: (submoduleCode) =>
      get().allowedSubmodules.includes(normalizeSubmoduleCode(submoduleCode)),
  }),
);
