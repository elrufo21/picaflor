import { Navigate } from "react-router";
import PackageCreate from "./pages/fulldayCreate";
import PackageList from "./pages/fulldayList";
import Pscreate from "./pages/fulldayPassengerCreate";

import ViajeForm from "./pages/viajeForm";
import FulldayListado from "./pages/fulldayListado";
import InvoicePreview from "./pages/fulldayInvoicePreview";
import ProgramacionLiquidaciones from "./pages/programacionLiquidaciones";
import FullDayBoletaPreview from "./pages/fulldayBoletaPreview";

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
    path: "fullday/:idProduct/passengers/new",
    element: <ViajeForm />,
    handle: {
      breadcrumb: [
        { label: "Full Day", to: "/fullday" },
        { label: "Nuevo pasajero" },
      ],
    },
  },
  {
    path: "fullday/:idProduct/passengers/view/:liquidacionId",
    element: <ViajeForm />,
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
      breadcrumb: [{ label: "Full Day", to: "/fullday" }, { label: "Factura" }],
    },
  },
  {
    path: "fullday/:idProduct/passengers/boleta",
    element: <FullDayBoletaPreview />,
    handle: {
      breadcrumb: [{ label: "Full Day", to: "/fullday" }, { label: "Boleta" }],
    },
  },
  {
    path: "fullday/:id/listado",
    element: <FulldayListado />,
    handle: {
      breadcrumb: [{ label: "Full Day", to: "/fullday" }, { label: "Listado" }],
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
