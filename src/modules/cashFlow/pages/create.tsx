import CashFlowForm from "./components/cashFlowForm";

const CashFlowCreate = () => (
  <div className="space-y-4">
    <header className="space-y-1">
      <h1 className="text-xl font-semibold text-slate-900">
        Nuevo control de flujo
      </h1>
    </header>

    <CashFlowForm />
  </div>
);

export default CashFlowCreate;
