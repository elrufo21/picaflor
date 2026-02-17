import type { ReactNode } from "react";

type MaintenancePageFrameProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function MaintenancePageFrame({
  title,
  description,
  action,
  children,
}: MaintenancePageFrameProps) {
  return (
    <div className="p-4 sm:p-6 space-y-2">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-orange-50/60 to-amber-50/40 shadow-sm">
        <div className="px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide uppercase text-[#E8612A]">
              Mantenimiento
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
              {title}
            </h1>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </section>

      {children}
    </div>
  );
}
