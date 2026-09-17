import BibleCalendar from "./pages/BibleCalendar";
import { Navigate } from "react-router";

export default [
  {
    path: "biblia",
    element: <BibleCalendar />,
    handle: {
      breadcrumb: [{ label: "La Biblia" }],
    },
  },
  { path: "biblia/traslados", element: <Navigate to="/traslados" replace /> },
  { path: "biblia/movilidad", element: <Navigate to="/traslados" replace /> },
];
