import PackageCreate from "./pages/packageCreate";
import PackageList from "./pages/packageList";
import PackagePassengerCreate from "./pages/packagePassengerCreate";

export default [
  {
    path: "package",
    element: <PackageList />,
    handle: {
      breadcrumb: [{ label: "Paquetes" }],
    },
  },
  {
    path: "package/new",
    element: <PackageCreate />,
    handle: {
      breadcrumb: [{ label: "Paquetes", to: "/package" }],
    },
  },
  {
    path: "package/:id/passengers/new",
    element: <PackagePassengerCreate />,
    handle: {
      breadcrumb: [
        { label: "Paquetes", to: "/package" },
        { label: "Nuevo pasajero" },
      ],
    },
  },
];
