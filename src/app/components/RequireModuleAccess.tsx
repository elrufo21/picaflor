import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import type { ModuleCode } from "@/app/auth/mockModulePermissions";
import { useAuthStore } from "@/store/auth/auth.store";
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";

type Props = {
  moduleCode: ModuleCode;
  children: ReactNode;
};

const RequireModuleAccess = ({ moduleCode, children }: Props) => {
  const location = useLocation();
  const isExternalUser = useAuthStore((state) => state.user?.isExternal === true);
  const { loaded, canAccessModule, canAccessAction, getFirstAllowedPath } =
    useModulePermissionsStore();

  if (!loaded) return null;

  const isListadoRoute = /^\/(?:fullday|citytour)\/[^/]+\/listado\/?$/.test(
    location.pathname,
  );
  if (isExternalUser && isListadoRoute) {
    return <Navigate to={`/${moduleCode}`} replace />;
  }

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
