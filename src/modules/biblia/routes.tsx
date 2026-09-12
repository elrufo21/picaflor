import BibleCalendar from "./pages/BibleCalendar";
import MobilityLiquidation from "./pages/MobilityLiquidation";

export default [
  {
    path: "biblia",
    element: <BibleCalendar />,
    handle: {
      breadcrumb: [{ label: "La Biblia" }],
    },
  },
  {
    path: "biblia/movilidad",
    element: <MobilityLiquidation />,
    handle: {
      breadcrumb: [{ label: "La Biblia", to: "/biblia" }, { label: "Liquidación de movilidad" }],
    },
  },
];
