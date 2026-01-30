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
} from "lucide-react";
import { useNavigate } from "react-router";

export default function MaintenanceDashboard() {
  const navigate = useNavigate();

  const items = [
    {
      title: "Categorías",
      desc: "Gestiona categorías y códigos SUNAT.",
      icon: <Grid3X3 className="w-10 h-10 text-blue-600" />,
      route: "/maintenance/categories",
    },
    {
      title: "Productos",
      desc: "Consulta el catálogo sincronizado de productos.",
      icon: <Package className="w-10 h-10 text-emerald-600" />,
      route: "/maintenance/products",
    },
    {
      title: "Actividades adicionales",
      desc: "Registra precios complementarios para cada producto.",
      icon: <Sparkles className="w-10 h-10 text-sky-600" />,
      route: "/maintenance/actividades",
    },
    {
      title: "Áreas",
      desc: "Organiza las áreas de la empresa.",
      icon: <Layers className="w-10 h-10 text-green-600" />,
      route: "/maintenance/areas",
    },
    {
      title: "Hoteles",
      desc: "Consulta horarios y direcciones disponibles.",
      icon: <Bed className="w-10 h-10 text-amber-600" />,
      route: "/maintenance/hotels",
    },
    {
      title: "Puntos de partida",
      desc: "Registra los puntos antes de que partan los viajes.",
      icon: <MapPin className="w-10 h-10 text-rose-600" />,
      route: "/maintenance/partidas",
    },
    {
      title: "Clientes",
      desc: "Registra y controla los clientes",
      icon: <Building2 className="w-10 h-10 text-slate-700" />,
      route: "/maintenance/clients",
    },
    {
      title: "Empleados",
      desc: "Registra y controla los empleados",
      icon: <Users2 className="w-10 h-10 text-slate-700" />,
      route: "/maintenance/employees",
    },
    {
      title: "Usuarios",
      desc: "Registra y controla los usuarios",
      icon: <UserCheck2Icon className="w-10 h-10 text-shadow-rose-600" />,
      route: "/maintenance/users",
    },
    {
      title: "Canal de venta",
      desc: "Registra y controla los canales de venta",
      icon: <Handshake className="w-10 h-10 text-shadow-rose-600" />,
      route: "/maintenance/salesChannel",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Mantenimiento</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.title}
            onClick={() => navigate(item.route)}
            className="
              cursor-pointer 
              bg-white shadow-md rounded-xl p-6 
              hover:shadow-xl transition 
              border border-gray-200
            "
          >
            <div className="flex items-center gap-4">
              {item.icon}
              <div>
                <h2 className="text-lg font-bold">{item.title}</h2>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
