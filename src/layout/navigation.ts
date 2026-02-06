import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Wrench,
  Plane,
  Car,
  CalendarDays,
  Sparkles,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description?: string;
  children?: NavigationItem[];
  end?: boolean;
};

export const navigationItems: NavigationItem[] = [
  {
    label: "Full Day",
    to: "/fullday",
    icon: Plane,
    description: "Experiencias de dia completo",
    end: true,
    children: [],
  },
  {
    label: "Programación",
    to: "/fullday/programacion/liquidaciones",
    icon: CalendarDays,
    description: "Listado de liquidaciones",
    end: true,
  },
  {
    label: "Cash Flow",
    to: "/cashflow",
    icon: LayoutDashboard,
    description: "Control y conciliación diaria",
    end: true,
  },
  {
    label: "City Tour",
    to: "/citytour",
    icon: Car,
    description: "Turismo local",
    end: true,
  },

  {
    label: "Mantenimiento",
    to: "/maintenance",
    icon: Wrench,
    description: "Catálogos y usuarios",
  },
];
