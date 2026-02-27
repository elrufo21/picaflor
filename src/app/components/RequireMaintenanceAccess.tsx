import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "@/store/auth/auth.store";
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";

type Props = {
  children: React.ReactNode;
};

const STORAGE_KEY = "picaflor.auth.session";

const readAreaIdFromStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      user?: { areaId?: string | number | null };
    };
    return parsed?.user?.areaId ?? null;
  } catch {
    return null;
  }
};

const RequireMaintenanceAccess = ({ children }: Props) => {
  const location = useLocation();
  const authAreaId = useAuthStore((state) => state.user?.areaId ?? null);
  const canAccessMaintenance = useModulePermissionsStore((state) =>
    state.canAccessModule("maintenance"),
  );
  const canAccessSecurity = useModulePermissionsStore((state) =>
    state.canAccessModule("security"),
  );
  const storageAreaId = readAreaIdFromStorage();
  const areaId = String(authAreaId ?? storageAreaId ?? "");
  const hasModuleAccess = canAccessMaintenance || canAccessSecurity;

  if (areaId !== "6" && !hasModuleAccess) {
    return <Navigate to="/fullday" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RequireMaintenanceAccess;
