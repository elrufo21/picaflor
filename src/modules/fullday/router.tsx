import { Navigate } from "react-router";
import PackageCreate from "./pages/fulldayCreate";
import PackageList from "./pages/fulldayList";
import PackagePassengerCreate from "./pages/fulldayPassengerCreate";
import FulldayListado from "./pages/fulldayListado";
import InvoicePreview from "./pages/fulldayInvoicePreview";
import ProgramacionLiquidaciones from "./pages/programacionLiquidaciones";

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
    path: "fullday/:id/passengers/view/:liquidacionId",
    element: <PackagePassengerCreate />,
    handle: {
      breadcrumb: [
        { label: "Full Day", to: "/fullday" },
        { label: "Liquidación", to: "/programacion/liquidaciones" },
        { label: "Ver" },
      ],
    },
  },
  {
    path: "fullday/:id/passengers/preview",
    element: <InvoicePreview />,
    handle: {
      breadcrumb: [
        { label: "Full Day", to: "/fullday" },
        { label: "Factura" },
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
  {
    path: "fullday/programacion",
    element: <Navigate to="/fullday/programacion/liquidaciones" replace />,
  },
  {
    path: "fullday/programacion/liquidaciones",
    element: <ProgramacionLiquidaciones />,
    handle: {
      breadcrumb: [
        { label: "Full Day", to: "/fullday" },
        { label: "Programación" },
        { label: "Liquidaciones" },
      ],
    },
  },
];
