import TravelPackageForm from "./pages/travelPackageForm";

export default [
  {
    path: "paquete-viaje",
    element: <TravelPackageForm />,
    handle: {
      breadcrumb: [{ label: "Paquete de Viaje" }],
    },
  },
];
