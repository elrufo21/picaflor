import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/auth/auth.store";
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";
import { useSubmodulePermissionsStore } from "@/store/permissions/submodulePermissions.store";

export type MaintenancePermissionAccess = {
  read: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

const normalize = (value: string) => String(value ?? "").trim().toLowerCase();

const hasMaintenanceGranularPermissions = (
  allowedSubmodules: string[],
  rawAllowedSubmodules?: string,
  rawSubmoduleActions?: string,
) => {
  if (allowedSubmodules.some((code) => normalize(code).startsWith("maintenance."))) {
    return true;
  }

  if (normalize(rawAllowedSubmodules ?? "").includes("maintenance.")) {
    return true;
  }

  return normalize(rawSubmoduleActions ?? "").includes("maintenance.");
};

export const useMaintenanceAccessResolver = () => {
  const authUser = useAuthStore((state) => state.user);
  const canAccessAction = useModulePermissionsStore((state) => state.canAccessAction);
  const allowedSubmodules = useSubmodulePermissionsStore(
    (state) => state.allowedSubmodules,
  );
  const canAccessSubmodule = useSubmodulePermissionsStore(
    (state) => state.canAccessSubmodule,
  );
  const canAccessSubmoduleAction = useSubmodulePermissionsStore(
    (state) => state.canAccessSubmoduleAction,
  );

  const useGranularBySubmodule = useMemo(
    () =>
      hasMaintenanceGranularPermissions(
        allowedSubmodules,
        authUser?.rawAllowedSubmodules,
        authUser?.rawSubmoduleActions,
      ),
    [allowedSubmodules, authUser?.rawAllowedSubmodules, authUser?.rawSubmoduleActions],
  );

  return useCallback(
    (submoduleCode?: string): MaintenancePermissionAccess => {
      if (!submoduleCode || !useGranularBySubmodule) {
        return {
          read: canAccessAction("maintenance", "read"),
          create: canAccessAction("maintenance", "create"),
          edit: canAccessAction("maintenance", "edit"),
          delete: canAccessAction("maintenance", "delete"),
        };
      }

      const code = normalize(submoduleCode);
      const canRead =
        canAccessSubmoduleAction(code, "read") || canAccessSubmodule(code);

      return {
        read: canRead,
        create: canRead && canAccessSubmoduleAction(code, "create"),
        edit: canRead && canAccessSubmoduleAction(code, "edit"),
        delete: canRead && canAccessSubmoduleAction(code, "delete"),
      };
    },
    [
      canAccessAction,
      canAccessSubmodule,
      canAccessSubmoduleAction,
      useGranularBySubmodule,
    ],
  );
};
