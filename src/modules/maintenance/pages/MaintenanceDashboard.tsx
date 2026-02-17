import {
  Layers,
  Grid3X3,
  Users2,
  UserCheck2Icon,
  Building2,
  Handshake,
  Bed,
  MapPin,
  Package,
  Sparkles,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function MaintenanceDashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const items = [
    {
      title: "Categorias",
      desc: "Gestiona categorias y codigos SUNAT.",
      icon: Grid3X3,
      iconClass: "text-blue-600",
      route: "/maintenance/categories",
    },
    {
      title: "Productos",
      desc: "Consulta el catalogo sincronizado de productos.",
      icon: Package,
      iconClass: "text-emerald-600",
      route: "/maintenance/products",
    },
    {
      title: "Actividades adicionales",
      desc: "Registra precios complementarios para cada producto.",
      icon: Sparkles,
      iconClass: "text-sky-600",
      route: "/maintenance/actividades",
    },
    {
      title: "Areas",
      desc: "Organiza las areas de la empresa.",
      icon: Layers,
      iconClass: "text-green-600",
      route: "/maintenance/areas",
    },
    {
      title: "Hoteles",
      desc: "Consulta horarios y direcciones disponibles.",
      icon: Bed,
      iconClass: "text-amber-600",
      route: "/maintenance/hotels",
    },
    {
      title: "Puntos de partida",
      desc: "Registra puntos de salida para los viajes.",
      icon: MapPin,
      iconClass: "text-rose-600",
      route: "/maintenance/partidas",
    },
    {
      title: "Clientes",
      desc: "Registra y controla los clientes.",
      icon: Building2,
      iconClass: "text-slate-700",
      route: "/maintenance/clients",
    },
    {
      title: "Empleados",
      desc: "Registra y controla el personal.",
      icon: Users2,
      iconClass: "text-slate-700",
      route: "/maintenance/employees",
    },
    {
      title: "Usuarios",
      desc: "Registra y controla usuarios del sistema.",
      icon: UserCheck2Icon,
      iconClass: "text-violet-600",
      route: "/maintenance/users",
    },
    {
      title: "Canal de venta",
      desc: "Registra y controla canales de venta.",
      icon: Handshake,
      iconClass: "text-cyan-700",
      route: "/maintenance/salesChannel",
    },
  ];

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = !normalizedQuery
    ? items
    : items.filter((item) => {
        const title = item.title.toLowerCase();
        const desc = item.desc.toLowerCase();
        return title.includes(normalizedQuery) || desc.includes(normalizedQuery);
      });

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-orange-50/70 to-amber-50/40 shadow-sm">
        <div className="px-5 py-5 sm:px-6 sm:py-6 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-[#E8612A]">
              Panel de mantenimiento
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">Modulos de configuracion</h1>
            <p className="text-sm text-slate-600 mt-1">
              Accede rapido a los catalogos y parametros principales del sistema.
            </p>
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar modulo..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#E8612A] focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => navigate(item.route)}
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 ${item.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-[#E8612A]" />
              </div>

              <h2 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600">
          No se encontraron modulos para "{query}".
        </div>
      )}
    </div>
  );
}
