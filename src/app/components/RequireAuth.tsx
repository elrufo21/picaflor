import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "@/store/auth/auth.store";
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";
import { useSubmodulePermissionsStore } from "@/store/permissions/submodulePermissions.store";

type Props = {
  children: React.ReactNode;
};

const RequireAuth = ({ children }: Props) => {
  const location = useLocation();
  const { isAuthenticated, hydrated, hydrate, user } = useAuthStore();
  const loadModulePermissions = useModulePermissionsStore(
    (state) => state.loadForUser,
  );
  const clearModulePermissions = useModulePermissionsStore(
    (state) => state.clear,
  );
  const loadSubmodulePermissions = useSubmodulePermissionsStore(
    (state) => state.loadForUser,
  );
  const clearSubmodulePermissions = useSubmodulePermissionsStore(
    (state) => state.clear,
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      clearModulePermissions();
      clearSubmodulePermissions();
      return;
    }
    loadModulePermissions(user);
    loadSubmodulePermissions(user);
  }, [
    clearModulePermissions,
    clearSubmodulePermissions,
    hydrated,
    isAuthenticated,
    loadModulePermissions,
    loadSubmodulePermissions,
    user,
  ]);

  if (!hydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
