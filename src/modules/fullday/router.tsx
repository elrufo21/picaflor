import PackageCreate from "./pages/fulldayCreate";
import PackageList from "./pages/fulldayList";
import PackagePassengerCreate from "./pages/fulldayPassengerCreate";
import FulldayListado from "./pages/fulldayListado";

export default [
  {
    path: "fullday",
    element: <PackageList />,
    handle: {
      breadcrumb: [{ label: "Full Day" }],
    },
  },
  {
    path: "fullday/new",
    element: <PackageCreate />,
    handle: {
      breadcrumb: [{ label: "Full Day", to: "/fullday" }],
    },
  },
  {
    path: "fullday/:id/passengers/new",
    element: <PackagePassengerCreate />,
    handle: {
      breadcrumb: [
        { label: "Full Day", to: "/fullday" },
        { label: "Nuevo pasajero" },
      ],
    },
  },
  {
    path: "fullday/:id/listado",
    element: <FulldayListado />,
    handle: {
      breadcrumb: [
        { label: "Full Day", to: "/fullday" },
        { label: "Listado" },
      ],
    },
  },
];
