import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Wrench,
  Plane,
  Car,
  CalendarDays,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description?: string;
  children?: NavigationItem[];
};

export const navigationItems: NavigationItem[] = [
  {
    label: "Panel",
    to: "/",
    icon: LayoutDashboard,
    description: "Resumen general",
  },
  {
    label: "Full Day",
    to: "/fullday",
    icon: Plane,
    description: "Experiencias de dia completo",
    children: [
      {
        label: "Programación",
        to: "/fullday/programacion/liquidaciones",
        icon: CalendarDays,
        description: "Listado de liquidaciones",
      },
    ],
  },
  {
    label: "City Tour",
    to: "/vity-tour",
    icon: Car,
    description: "Turismo local",
  },
  {
    label: "Paquetes",
    to: "/packages",
    icon: Package,
    description: "Ofertas de viajes",
  },

  {
    label: "Mantenimiento",
    to: "/maintenance",
    icon: Wrench,
    description: "Catálogos y usuarios",
  },
];
