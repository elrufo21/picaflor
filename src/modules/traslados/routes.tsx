import TransferForm from "../biblia/pages/TransferForm";

export default [
  {
    path: "traslados",
    element: <TransferForm />,
    handle: {
      breadcrumb: [{ label: "Traslados" }],
    },
  },
];
