import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wrench,
  Plane,
  Car,
  CalendarDays,
  Briefcase,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description?: string;
  children?: NavigationItem[];
  end?: boolean;
  requiresAreaId?: string;
};

export const filterNavigationItemsByArea = (
  items: NavigationItem[],
  areaId: string,
): NavigationItem[] => {
  const normalizedAreaId = String(areaId ?? "").trim();

  return items
    .filter(
      (item) =>
        !item.requiresAreaId || item.requiresAreaId === normalizedAreaId,
    )
    .map((item) =>
      item.children?.length
        ? {
            ...item,
            children: filterNavigationItemsByArea(
              item.children,
              normalizedAreaId,
            ),
          }
        : item,
    );
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
    label: "Tour de Lima",
    to: "/citytour",
    icon: Car,
    description: "Turismo local",
    end: true,
  },
  {
    label: "Paquete de Viaje",
    to: "/paquete-viaje",
    icon: Briefcase,
    description: "Formulario de itinerario",
    end: true,
  },

  {
    label: "Mantenimiento",
    to: "/maintenance",
    icon: Wrench,
    description: "Catálogos y usuarios",
    requiresAreaId: "6",
  },
];
