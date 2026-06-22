import { Navigate } from "react-router";
import SaleLiquidationList from "./pages/SaleLiquidationList";
import SaleLiquidationForm from "./pages/SaleLiquidationForm";

export default [
  {
    path: "sale-liquidations",
    element: <SaleLiquidationList />,
    default: true,
  },
  {
    path: "sale-liquidations/new",
    element: <SaleLiquidationForm />,
  },
  {
    path: "sale-liquidation/:id",
    element: <SaleLiquidationForm />,
  },
];
