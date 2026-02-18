import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";

type MaintenancePageFrameProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  backTo?: string;
  showBackButton?: boolean;
};

export default function MaintenancePageFrame({
  title,
  description,
  action,
  children,
  backTo = "/maintenance",
  showBackButton = true,
}: MaintenancePageFrameProps) {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 space-y-2">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-orange-50/60 to-amber-50/40 shadow-sm">
        <div className="px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-center gap-3">
            {showBackButton && (
              <button
                type="button"
                onClick={() => navigate(backTo)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                aria-label="Volver a mantenimiento"
                title="Volver"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex w-full flex-col">
              <p className="text-xs font-semibold tracking-wide uppercase text-[#E8612A]">
                Mantenimiento
              </p>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                {title}
              </h1>
              {/*description ? (
                <p className="text-sm text-slate-600 mt-0.5">{description}</p>
              ) : null*/}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </div>
      </section>
      {children}
    </div>
  );
}
