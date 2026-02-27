import RequireMaintenanceAccess from "@/app/components/RequireMaintenanceAccess";
import AreaList from "@/modules/maintenance/areas/pages/areaList";
import UserList from "@/modules/maintenance/users/pages/userList";
import SecurityDashboard from "./pages/SecurityDashboard";
import SecurityPermissionsPage from "./pages/SecurityPermissionsPage";
import SecurityAreaPermissionsPage from "./pages/SecurityAreaPermissionsPage";

const securityRoutes = [
  {
    path: "seguridad",
    element: <SecurityDashboard />,
    handle: {
      breadcrumb: [{ label: "Seguridad" }],
    },
    end: true,
  },
  {
    path: "seguridad/areas",
    element: <AreaList />,
    handle: {
      breadcrumb: [
        { label: "Seguridad", to: "/seguridad" },
        { label: "Áreas" },
      ],
    },
  },
  {
    path: "seguridad/usuarios",
    element: <UserList />,
    handle: {
      breadcrumb: [
        { label: "Seguridad", to: "/seguridad" },
        { label: "Usuarios" },
      ],
    },
  },
  {
    path: "seguridad/permisos",
    element: <SecurityPermissionsPage />,
    handle: {
      breadcrumb: [
        { label: "Seguridad", to: "/seguridad" },
        { label: "Permisos" },
      ],
    },
  },
  {
    path: "seguridad/permisos-areas",
    element: <SecurityAreaPermissionsPage />,
    handle: {
      breadcrumb: [
        { label: "Seguridad", to: "/seguridad" },
        { label: "Permisos por área" },
      ],
    },
  },
];

const guardedSecurityRoutes = securityRoutes.map((route) => ({
  ...route,
  element: <RequireMaintenanceAccess>{route.element}</RequireMaintenanceAccess>,
}));

export default guardedSecurityRoutes;
