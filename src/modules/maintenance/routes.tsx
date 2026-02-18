import { Navigate } from "react-router";
import MaintenanceDashboard from "./pages/MaintenanceDashboard";
import UserList from "./users/pages/userList";
import AreaList from "./areas/pages/areaList";
import CategoryList from "./categories/pages/categoryList";
import EmployeeList from "./employees/pages/employeeList";
import ClientList from "./clients/pages/clientList";
import SalesChannelPage from "./salesChannel/pages/salesChannelPage";
import HotelList from "./hotels/pages/hotelList";
import PartidaList from "./partidas/pages/partidaList";
import ProductList from "./products/pages/productList";
import ActividadAdiList from "./actividadesAdi/pages/actividadList";

// Por ahora dejamos solo usuarios y áreas activas en mantenimiento.
export default [
  {
    path: "maintenance",
    element: <MaintenanceDashboard />,
    handle: {
      breadcrumb: [{ label: "Mantenimiento" }],
    },
    end: true,
  },
  {
    path: "maintenance/categories",
    element: <CategoryList />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Categorías" },
      ],
    },
  },
  {
    path: "maintenance/categories/create",
    element: <Navigate to="/maintenance/categories" replace />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Categorías", to: "/maintenance/categories" },
        { label: "Crear categoría" },
      ],
    },
  },
  {
    path: "maintenance/categories/:id/edit",
    element: <Navigate to="/maintenance/categories" replace />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Categorías", to: "/maintenance/categories" },
        { label: "Editar categoría" },
      ],
    },
  },
  {
    path: "maintenance/areas",
    element: <AreaList />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Áreas" },
      ],
    },
  },
  {
    path: "maintenance/areas/create",
    element: <Navigate to="/maintenance/areas" replace />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Áreas", to: "/maintenance/areas" },
        { label: "Crear área" },
      ],
    },
  },
  // Alias en singular
  {
    path: "maintenance/area/create",
    element: <Navigate to="/maintenance/areas" replace />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Áreas", to: "/maintenance/areas" },
        { label: "Crear área" },
      ],
    },
  },
  {
    path: "maintenance/areas/:id/edit",
    element: <Navigate to="/maintenance/areas" replace />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Áreas", to: "/maintenance/areas" },
        { label: "Editar área" },
      ],
    },
  },
  // Alias en singular
  {
    path: "maintenance/area/:id/edit",
    element: <Navigate to="/maintenance/areas" replace />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Áreas", to: "/maintenance/areas" },
        { label: "Editar área" },
      ],
    },
  },
  {
    path: "maintenance/hotels",
    element: <HotelList />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Hoteles" },
      ],
    },
  },
  {
    path: "maintenance/partidas",
    element: <PartidaList />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Puntos de partida" },
      ],
    },
  },
  {
    path: "maintenance/products",
    element: <ProductList />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Productos" },
      ],
    },
  },
  {
    path: "maintenance/actividades",
    element: <ActividadAdiList />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Actividades adicionales" },
      ],
    },
  },
  {
    path: "maintenance/users",
    element: <UserList />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Usuarios" },
      ],
    },
  },
  {
    path: "maintenance/users/create",
    element: <Navigate to="/maintenance/users" replace />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Usuarios", to: "/maintenance/users" },
        { label: "Crear usuario" },
      ],
    },
  },
  {
    path: "maintenance/users/:id/edit",
    element: <Navigate to="/maintenance/users" replace />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Usuarios", to: "/maintenance/users" },
        { label: "Editar usuario" },
      ],
    },
  },
  {
    path: "maintenance/clients",
    element: <ClientList />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Clientes" },
      ],
    },
  },
  {
    path: "maintenance/clients/create",
    element: <Navigate to="/maintenance/clients" replace />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Clientes", to: "/maintenance/clients" },
        { label: "Crear cliente" },
      ],
    },
  },
  {
    path: "maintenance/clients/:id/edit",
    element: <Navigate to="/maintenance/clients" replace />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Clientes", to: "/maintenance/clients" },
        { label: "Editar cliente" },
      ],
    },
  },
  {
    path: "maintenance/employees",
    element: <EmployeeList />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Empleados" },
      ],
    },
  },
  {
    path: "maintenance/employees/create",
    element: <Navigate to="/maintenance/employees" replace />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Empleados", to: "/maintenance/employees" },
        { label: "Crear empleado" },
      ],
    },
  },
  {
    path: "maintenance/employees/:id/edit",
    element: <Navigate to="/maintenance/employees" replace />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Empleados", to: "/maintenance/employees" },
        { label: "Editar empleado" },
      ],
    },
  },
  {
    path: "maintenance/salesChannel",
    element: <SalesChannelPage />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Canal de venta", to: "/maintenance/salesChannel" },
      ],
    },
  },
];
