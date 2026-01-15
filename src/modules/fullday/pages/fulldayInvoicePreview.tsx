import { useMemo } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { useLocation, useNavigate, useParams } from "react-router";
import { showToast } from "@/components/ui/AppToast";
import PdfDocument, { type InvoiceData } from "@/components/invoice/Invoice";

type LocationState = {
  invoiceData?: InvoiceData;
  backendPayload?: string;
};

const INVOICE_HEIGHT = 760;

const InvoicePreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { invoiceData, backendPayload } = (location.state ??
    {}) as LocationState;

  const backendInfo = useMemo(() => {
    const parts = String(backendPayload ?? "").split("¬¬¬");
    return {
      orden: parts[0] || null,
      fecha: parts[1] || null,
    };
  }, [backendPayload]);

  const createPdfBlob = async () => {
    if (!invoiceData)
      throw new Error("No se encontró la información de la factura.");
    return pdf(<PdfDocument data={invoiceData} />).toBlob();
  };

  const handleDownload = async () => {
    try {
      const blob = await createPdfBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `full-day-${backendInfo.orden || "factura"}.pdf`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error: any) {
      showToast({
        title: "Error",
        description: error?.message ?? "No se pudo descargar la factura.",
        type: "error",
      });
    }
  };

  const handlePrint = async () => {
    try {
      const blob = await createPdfBlob();
      const url = URL.createObjectURL(blob);
      const popup = window.open(url, "_blank");
      if (!popup) {
        URL.revokeObjectURL(url);
        showToast({
          title: "Atención",
          description:
            "Permite las ventanas emergentes para imprimir la factura.",
          type: "warning",
        });
        return;
      }
      popup.focus();
      popup.addEventListener("load", () => {
        popup.print();
      });
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error: any) {
      showToast({
        title: "Error",
        description: error?.message ?? "No se pudo imprimir la factura.",
        type: "error",
      });
    }
  };

  const handleRegisterAnother = () => {
    if (!id) return;
    navigate(`/fullday`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            {backendInfo.orden ?? "No disponible"}
          </p>
          <p className="text-xs text-slate-500">
            {backendInfo.fecha
              ? `Fecha: ${backendInfo.fecha}`
              : "Fecha no registrada"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!invoiceData}
            className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-400 disabled:opacity-50"
          >
            Descargar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!invoiceData}
            className="rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 transition hover:border-emerald-500 disabled:opacity-50"
          >
            Imprimir
          </button>
          <button
            type="button"
            onClick={handleRegisterAnother}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
          >
            Registrar otro
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {invoiceData ? (
          <div
            className="rounded-xl border border-slate-200"
            style={{ minHeight: INVOICE_HEIGHT }}
          >
            <PDFViewer style={{ width: "100%", height: INVOICE_HEIGHT }}>
              <PdfDocument data={invoiceData} />
            </PDFViewer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-600">
            <p>No hay datos para mostrar.</p>
            <button
              type="button"
              onClick={handleRegisterAnother}
              className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-400"
            >
              Volver al formulario
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePreview;
