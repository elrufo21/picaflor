import { Navigate } from "react-router";
import CashFlowCreate from "./pages/create";
import CashFlowList from "./pages/list";
import CashFlowUpdate from "./pages/update";

export default [
  {
    path: "cashflow",
    element: <CashFlowList />,
    handle: {
      breadcrumb: [{ label: "Cash Flow" }],
    },
  },
  {
    path: "cashflow/create",
    element: <CashFlowCreate />,
    handle: {
      breadcrumb: [
        { label: "Cash Flow", to: "/cashflow" },
        { label: "Nuevo control" },
      ],
    },
  },
  {
    path: "cashflow/:id/edit",
    element: <CashFlowUpdate />,
    handle: {
      breadcrumb: [
        { label: "Cash Flow", to: "/cashflow" },
        { label: "Editar control" },
      ],
    },
  },
  {
    path: "cashflow/*",
    element: <Navigate to="/cashflow" replace />,
  },
];
