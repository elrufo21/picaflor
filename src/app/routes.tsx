import { createBrowserRouter } from "react-router";
import type { ReactNode } from "react";
import MainLayout from "../layout/MainLayout";
import Projects from "./pages/Projects";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import fulldayRoutes from "../modules/fullday/router";
import cashFlowRoutes from "../modules/cashFlow/routes";
import citytourRoutes from "../modules/citytour/router";
import maintenanceRoutes from "../modules/maintenance/routes";
import securityRoutes from "../modules/security/routes";
import travelPackageRoutes from "../modules/travelPackage/router";
import RequireAuth from "./components/RequireAuth";
import RequireModuleAccess from "./components/RequireModuleAccess";
import ModuleDefaultRedirect from "./components/ModuleDefaultRedirect";
import Login from "./pages/Login";
import Forbidden from "./pages/Forbidden";
import type { ModuleCode } from "./auth/mockModulePermissions";

type RouteEntry = {
  path?: string;
  element?: ReactNode;
  handle?: unknown;
};

const withModuleGuard = (routes: RouteEntry[], moduleCode: ModuleCode) =>
  routes.map((route) => ({
    ...route,
    element: route.element ? (
      <RequireModuleAccess moduleCode={moduleCode}>
        {route.element}
      </RequireModuleAccess>
    ) : (
      route.element
    ),
  }));

const isFulldayProgramacionRoute = (path?: string) =>
  typeof path === "string" && path.startsWith("fullday/programacion");

const fulldayRouteEntries = fulldayRoutes as RouteEntry[];
const fulldayProgramacionRoutes = fulldayRouteEntries.filter((route) =>
  isFulldayProgramacionRoute(route.path),
);
const fulldayCoreRoutes = fulldayRouteEntries.filter(
  (route) => !isFulldayProgramacionRoute(route.path),
);

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/",
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ModuleDefaultRedirect /> },
      { path: "403", element: <Forbidden /> },
      { path: "projects", element: <Projects /> },
      { path: "reports", element: <Reports /> },
      { path: "settings", element: <Settings /> },
      ...withModuleGuard(fulldayCoreRoutes, "fullday"),
      ...withModuleGuard(fulldayProgramacionRoutes, "programacion"),
      ...withModuleGuard(citytourRoutes as RouteEntry[], "citytour"),
      ...withModuleGuard(travelPackageRoutes as RouteEntry[], "paquete_viaje"),
      ...withModuleGuard(cashFlowRoutes as RouteEntry[], "cashflow"),
      ...withModuleGuard(maintenanceRoutes as RouteEntry[], "maintenance"),
      ...withModuleGuard(securityRoutes as RouteEntry[], "security"),
      { path: "*", element: <ModuleDefaultRedirect /> },
    ],
  },
]);

export default router;
