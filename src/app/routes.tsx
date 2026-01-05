import { createBrowserRouter, Navigate } from "react-router";
import MainLayout from "../layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import packageRoutes from "../modules/package/router";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "projects", element: <Projects /> },
      { path: "reports", element: <Reports /> },
      { path: "settings", element: <Settings /> },
      ...packageRoutes,
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default router;
