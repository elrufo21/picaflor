import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useDialogStore } from "../../app/store/dialogStore";

const sizeClassMap = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
} as const;

const Dialog = () => {
  const { isOpen, config, payload, closeDialog, setPayload } = useDialogStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeDialog();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, closeDialog]);

  const context = useMemo(
    () => ({
      payload,
      setPayload,
      close: closeDialog,
    }),
    [payload, setPayload, closeDialog]
  );

  if (!isOpen || !config) return null;

  const handleConfirm = async () => {
    if (!config.onConfirm) {
      closeDialog();
      return;
    }
    try {
      const result = config.onConfirm(payload);
      if (result instanceof Promise) {
        setIsSubmitting(true);
        await result;
      }
      closeDialog();
    } catch (error) {
      // Mantiene el diálogo abierto para permitir correcciones
      console.error("Dialog confirm error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sizeClass = sizeClassMap[config.size ?? "lg"];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={closeDialog}
      />
      <div
        className={`relative w-full ${sizeClass} bg-white rounded-xl shadow-2xl border border-slate-200`}
      >
        <div className="flex items-start gap-3 p-5 border-b border-slate-200">
          <div className="flex-1">
            {config.title && (
              <h2 className="text-lg font-semibold text-slate-900">
                {config.title}
              </h2>
            )}
            {config.description && (
              <p className="text-sm text-slate-600 mt-1">
                {config.description}
              </p>
            )}
          </div>
          <button
            className="p-2 rounded hover:bg-slate-100 transition-colors"
            onClick={closeDialog}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[70vh]">
          {config.content(context)}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50">
          {(config.showCancel ?? true) && (
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={closeDialog}
              disabled={isSubmitting}
            >
              {config.cancelLabel ?? "Cancelar"}
            </button>
          )}
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : config.confirmLabel ?? "Guardar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Dialog;
