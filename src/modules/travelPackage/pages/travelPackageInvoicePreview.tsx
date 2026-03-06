import { useMemo } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { useLocation, useNavigate, useParams } from "react-router";
import { Download, Printer } from "lucide-react";

import { showToast } from "@/components/ui/AppToast";
import PackageInvoicePdf, {
  type PackageInvoiceData,
} from "@/components/invoice/PackageInvoice";

type LocationState = {
  invoiceData?: PackageInvoiceData;
  packageId?: string | number;
};

const STORAGE_KEY = "travel-package:invoice-preview:data:v1";
const INVOICE_HEIGHT = 760;

const readStoredInvoiceData = (): PackageInvoiceData | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as PackageInvoiceData)
      : null;
  } catch {
    return null;
  }
};

const TravelPackageInvoicePreview = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { invoiceData: stateInvoiceData, packageId } = (location.state ??
    {}) as LocationState;
  const invoiceData = stateInvoiceData ?? readStoredInvoiceData();

  const effectiveId = String(packageId ?? id ?? "").trim();
  const pdfName = useMemo(() => {
    const fecha =
      String(invoiceData?.fechaEmision ?? "")
        .trim()
        .replace(/\//g, "-") || "SIN-FECHA";
    return `${fecha}-PaqueteViaje-ID-${effectiveId || "SIN-ID"}.pdf`;
  }, [effectiveId, invoiceData?.fechaEmision]);

  const createPdfBlob = async () => {
    if (!invoiceData) throw new Error("No se encontró información del invoice.");
    return pdf(<PackageInvoicePdf data={invoiceData} pdfName={pdfName} />).toBlob();
  };

  const handleDownload = async () => {
    try {
      const blob = await createPdfBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = pdfName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error: any) {
      showToast({
        title: "Error",
        description: error?.message ?? "No se pudo descargar el PDF.",
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
          description: "Permite ventanas emergentes para imprimir.",
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
        description: error?.message ?? "No se pudo imprimir el PDF.",
        type: "error",
      });
    }
  };

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-700">
          <span className="font-semibold">Paquete:</span>{" "}
          <span>{effectiveId || "-"}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/paquete-viaje")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
          >
            Volver al listado
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {invoiceData ? (
          isMobile ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm text-slate-600">
                La vista previa no está disponible en móviles.
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Descargar PDF
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Abrir / Imprimir
              </button>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-xl bg-white/80 p-2 shadow-lg backdrop-blur-md">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </button>
              </div>

              <PDFViewer
                showToolbar={false}
                style={{ width: "100%", height: INVOICE_HEIGHT }}
              >
                <PackageInvoicePdf data={invoiceData} pdfName={pdfName} />
              </PDFViewer>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-600">
            <p>No hay datos para mostrar.</p>
            <button
              type="button"
              onClick={() => navigate("/paquete-viaje")}
              className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-400"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelPackageInvoicePreview;
