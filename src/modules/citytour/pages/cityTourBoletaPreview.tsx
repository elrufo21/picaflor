import { useMemo } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { useLocation, useNavigate } from "react-router";
import { Download, Printer } from "lucide-react";
import { showToast } from "@/components/ui/AppToast";
import { InvoiceDocument } from "@/components/invoice/boleta";

type LocationState = {
  boletaData?: Record<string, unknown>;
};

const BOLETA_HEIGHT = 760;

const formatFechaViajeForFilename = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "SIN-FECHA";

  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${day}-${month}-${year}`;
  }

  const dmyMatch = raw.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${day}-${month}-${year}`;
  }

  return raw.replace(/[\\/:*?"<>|]/g, "-");
};

const CityTourBoletaPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { boletaData } = (location.state ?? {}) as LocationState;
  const boletaFilename = useMemo(() => {
    const fecha = formatFechaViajeForFilename(boletaData?.fechaViaje);
    const id = String(boletaData?.notaId ?? boletaData?.id ?? "SIN-ID").trim();
    return `${fecha}_DV_ID_${id}.pdf`;
  }, [boletaData]);

  const isMobile = useMemo(
    () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    [],
  );

  const createPdfBlob = async () => {
    if (!boletaData) throw new Error("No se encontró data para generar boleta.");
    return pdf(<InvoiceDocument data={boletaData} />).toBlob();
  };

  const handleDownload = async () => {
    try {
      const blob = await createPdfBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = boletaFilename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo descargar la boleta.";
      showToast({
        title: "Error",
        description: message,
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
          description: "Permite las ventanas emergentes para imprimir la boleta.",
          type: "warning",
        });
        return;
      }
      popup.focus();
      popup.addEventListener("load", () => popup.print());
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo imprimir la boleta.";
      showToast({
        title: "Error",
        description: message,
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-700">
          Boleta de liquidación{" "}
          <span className="font-semibold">
            #{String(boletaData?.notaId ?? "-")}
          </span>
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Volver
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {boletaData ? (
          isMobile ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm text-slate-600">
                La vista previa no está disponible en móvil.
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Descargar PDF
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
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
                  className="flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </button>
              </div>
              <PDFViewer
                showToolbar={false}
                style={{ width: "100%", height: BOLETA_HEIGHT }}
              >
                <InvoiceDocument data={boletaData} />
              </PDFViewer>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-600">
            <p>No hay datos para mostrar.</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CityTourBoletaPreview;
