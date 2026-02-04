import { Navigate } from "react-router";
import PackageCreate from "./pages/cityTourCreate";
import PackageList from "./pages/cityTourList";
import Pscreate from "./pages/cityTourPassengerCreate";

import ViajeForm from "./pages/viajeForm";
import FulldayListado from "./pages/cityTourListado";
import CityInvoicePreview from "./pages/cityTourInvoicePreview";
import ProgramacionLiquidaciones from "./pages/gramacionLiquidaciones";

export default [
  {
    path: "citytour",
    element: <PackageList />,
    handle: {
      breadcrumb: [{ label: "City Tour" }],
    },
  },
  {
    path: "citytour/new",
    element: <PackageCreate />,
    handle: {
      breadcrumb: [{ label: "City Tour", to: "/citytour" }],
    },
  },
  {
    path: "citytour/:idProduct/passengers/new",
    element: <ViajeForm />,
    handle: {
      breadcrumb: [
        { label: "City Tour", to: "/citytour" },
        { label: "Nuevo pasajero" },
      ],
    },
  },
  {
    path: "citytour/:idProduct/passengers/view/:liquidacionId",
    element: <ViajeForm />,
    handle: {
      breadcrumb: [
        { label: "City Tour", to: "/citytour" },
        { label: "Liquidación", to: "/citytour/programacion/liquidaciones" },
        { label: "Ver" },
      ],
    },
  },
  {
    path: "citytour/:id/passengers/preview",
    element: <CityInvoicePreview />,
    handle: {
      breadcrumb: [
        { label: "City Tour", to: "/citytour" },
        { label: "Factura" },
      ],
    },
  },
  {
    path: "citytour/:id/listado",
    element: <FulldayListado />,
    handle: {
      breadcrumb: [
        { label: "City Tour", to: "/citytour" },
        { label: "Listado" },
      ],
    },
  },
  {
    path: "citytour/programacion",
    element: <Navigate to="/citytour/programacion/liquidaciones" replace />,
  },
  {
    path: "citytour/programacion/liquidaciones",
    element: <ProgramacionLiquidaciones />,
    handle: {
      breadcrumb: [
        { label: "City Tour", to: "/citytour" },
        { label: "Programación" },
        { label: "Liquidaciones" },
      ],
    },
  },
];
