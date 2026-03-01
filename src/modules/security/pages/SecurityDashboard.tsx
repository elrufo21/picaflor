import { ArrowUpRight, ShieldCheck, KeyRound, Building2 } from "lucide-react";
import { useNavigate } from "react-router";

export default function SecurityDashboard() {
  const navigate = useNavigate();

  const items = [
    {
      title: "Permisos por área",
      desc: "Define la base heredada para cada área.",
      icon: Building2,
      route: "/seguridad/permisos-areas",
    },
    {
      title: "Permisos por usuario",
      desc: "Otorga o revoca acceso a módulos por usuario.",
      icon: KeyRound,
      route: "/seguridad/permisos",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-orange-50/70 to-amber-50/40 shadow-sm">
        <div className="px-5 py-5 sm:px-6 sm:py-6 flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-wide uppercase text-[#E8612A]">
            Módulo de seguridad
          </p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#E8612A]" />
            <h1 className="text-2xl font-semibold text-slate-900">Seguridad</h1>
          </div>
          <p className="text-sm text-slate-600">
            Gestiona las áreas y usuarios con acceso restringido a
            administrador.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => navigate(item.route)}
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-[#E8612A]">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-[#E8612A]" />
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900">
                {item.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
