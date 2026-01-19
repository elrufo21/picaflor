import MaintenanceDashboard from "./pages/MaintenanceDashboard";
import UserCreate from "./users/pages/userCreate";
import UserEdit from "./users/pages/userEdit";
import UserList from "./users/pages/userList";
import AreaList from "./areas/pages/areaList";
import AreaCreate from "./areas/pages/areaCreate";
import AreaEdit from "./areas/pages/areaEdit";
import CategoryList from "./categories/pages/categoryList";
import CategoryCreate from "./categories/pages/categoryCreate";
import CategoryEdit from "./categories/pages/categoryEdit";
import EmployeeList from "./employees/pages/employeeList";
import EmployeeCreate from "./employees/pages/employeeCreate";
import EmployeeEdit from "./employees/pages/employeeEdit";
import ClientList from "./clients/pages/clientList";
import ClientCreate from "./clients/pages/clientCreate";
import ClientEdit from "./clients/pages/clientEdit";
import SalesChannelPage from "./salesChannel/pages/salesChannelPage";

// Por ahora dejamos solo usuarios y áreas activas en mantenimiento.
export default [
  {
    path: "maintenance",
    element: <MaintenanceDashboard />,
    handle: {
      breadcrumb: [{ label: "Mantenimiento" }],
    },
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
    element: <CategoryCreate />,
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
    element: <CategoryEdit />,
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
    element: <AreaCreate />,
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
    element: <AreaCreate />,
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
    element: <AreaEdit />,
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
    element: <AreaEdit />,
    handle: {
      breadcrumb: [
        { label: "Mantenimiento", to: "/maintenance" },
        { label: "Áreas", to: "/maintenance/areas" },
        { label: "Editar área" },
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
    element: <UserCreate />,
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
    element: <UserEdit />,
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
    element: <ClientCreate />,
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
    element: <ClientEdit />,
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
    element: <EmployeeCreate />,
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
    element: <EmployeeEdit />,
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
