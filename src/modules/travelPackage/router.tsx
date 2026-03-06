import TravelPackageList from "./pages/travelPackageList";
import TravelPackageForm from "./pages/travelPackageForm";
import TravelPackageInvoicePreview from "./pages/travelPackageInvoicePreview";
import TravelPackageBoletaPreview from "./pages/travelPackageBoletaPreview";

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
  {
    path: "paquete-viaje/:id/preview",
    element: <TravelPackageInvoicePreview />,
    handle: {
      breadcrumb: [{ label: "Paquete de Viaje", to: "/paquete-viaje" }, { label: "Preview" }],
    },
  },
  {
    path: "paquete-viaje/preview",
    element: <TravelPackageInvoicePreview />,
    handle: {
      breadcrumb: [{ label: "Paquete de Viaje", to: "/paquete-viaje" }, { label: "Preview" }],
    },
  },
  {
    path: "paquete-viaje/:id/boleta",
    element: <TravelPackageBoletaPreview />,
    handle: {
      breadcrumb: [{ label: "Paquete de Viaje", to: "/paquete-viaje" }, { label: "Boleta" }],
    },
  },
];
