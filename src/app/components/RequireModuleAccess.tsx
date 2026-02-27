import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import type { ModuleCode } from "@/app/auth/mockModulePermissions";
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";

type Props = {
  moduleCode: ModuleCode;
  children: ReactNode;
};

const RequireModuleAccess = ({ moduleCode, children }: Props) => {
  const location = useLocation();
  const { loaded, canAccessModule, canAccessAction, getFirstAllowedPath } =
    useModulePermissionsStore();

  if (!loaded) return null;

  if (canAccessModule(moduleCode) && canAccessAction(moduleCode, "read")) {
    return <>{children}</>;
  }

  const fallbackPath = getFirstAllowedPath() ?? "/403";

  if (location.pathname === fallbackPath) {
    return <Navigate to="/403" replace />;
  }

  return <Navigate to={fallbackPath} state={{ from: location }} replace />;
};

export default RequireModuleAccess;
