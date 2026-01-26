import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

import CashFlowForm from "./components/cashFlowForm";
import { findCashFlowRecord } from "../data/cashFlowSeeds";

const CashFlowUpdate = () => {
  const navigate = useNavigate();
  const params = useParams();
  const cashFlowId = Number(params.id ?? "");

  const record = useMemo(
    () => (Number.isNaN(cashFlowId) ? null : findCashFlowRecord(cashFlowId)),
    [cashFlowId],
  );

  if (!record) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/cashflow")}
            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600"
          >
            <ArrowLeft className="inline-block h-4 w-4" />
            Volver
          </button>
          <h1 className="text-lg font-semibold text-slate-900">
            Registro no encontrado
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          El registro solicitado no existe en los datos de ejemplo.
        </p>
      </div>
    );
  }

  const { id, createdAt, ...formValues } = record;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-slate-500">
            Edita el control de caja y revisa totales. Los cambios solo afectan
            este ambiente de prueba.
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            Control #{id}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-slate-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </div>
      <CashFlowForm initialValues={formValues} />
    </div>
  );
};

export default CashFlowUpdate;
