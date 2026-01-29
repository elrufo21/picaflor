import { createBrowserRouter, Navigate } from "react-router";
import MainLayout from "../layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import fulldayRoutes from "../modules/fullday/router";
import cashFlowRoutes from "../modules/cashFlow/routes";
import citytourRoutes from "../modules/citytour/router";
import maintenanceRoutes from "../modules/maintenance/routes";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";

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
      { index: true, element: <Navigate to="/fullday" replace /> },
      { path: "projects", element: <Projects /> },
      { path: "reports", element: <Reports /> },
      { path: "settings", element: <Settings /> },
      ...fulldayRoutes,
      ...citytourRoutes,
      ...cashFlowRoutes,
      ...maintenanceRoutes,
      { path: "*", element: <Navigate to="/fullday" replace /> },
    ],
  },
]);

export default router;
