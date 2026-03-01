import { Navigate } from "react-router";
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";

const ModuleDefaultRedirect = () => {
  const { loaded, getFirstAllowedPath } = useModulePermissionsStore();

  if (!loaded) return null;

  const targetPath = getFirstAllowedPath() ?? "/403";
  return <Navigate to={targetPath} replace />;
};

export default ModuleDefaultRedirect;

