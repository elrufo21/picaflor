import TravelPackageList from "./pages/travelPackageList";
import TravelPackageForm from "./pages/travelPackageForm";

export default [
  {
    path: "paquete-viaje",
    element: <TravelPackageList />,
    handle: {
      breadcrumb: [{ label: "Paquete de Viaje" }, { label: "Listado" }],
    },
  },
  {
    path: "paquete-viaje/new",
    element: <TravelPackageForm />,
    handle: {
      breadcrumb: [{ label: "Paquete de Viaje", to: "/paquete-viaje" }, { label: "Nuevo" }],
    },
  },
  {
    path: "paquete-viaje/:id/edit",
    element: <TravelPackageForm />,
    handle: {
      breadcrumb: [{ label: "Paquete de Viaje", to: "/paquete-viaje" }, { label: "Editar" }],
    },
  },
];
