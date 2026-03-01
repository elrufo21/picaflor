import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wrench,
  Plane,
  Car,
  CalendarDays,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import type { ModuleCode } from "@/app/auth/mockModulePermissions";

export type NavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description?: string;
  children?: NavigationItem[];
  end?: boolean;
  requiresAreaId?: string;
  moduleCode?: ModuleCode;
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

export const filterNavigationItemsByModuleAccess = (
  items: NavigationItem[],
  canAccessModule: (moduleCode: ModuleCode) => boolean,
): NavigationItem[] => {
  return items.filter((item) =>
    item.moduleCode ? canAccessModule(item.moduleCode) : true,
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
    moduleCode: "fullday",
  },
  {
    label: "Programación",
    to: "/fullday/programacion/liquidaciones",
    icon: CalendarDays,
    description: "Listado de liquidaciones",
    end: true,
    moduleCode: "programacion",
  },
  {
    label: "Cash Flow",
    to: "/cashflow",
    icon: LayoutDashboard,
    description: "Control y conciliación diaria",
    end: true,
    moduleCode: "cashflow",
  },
  {
    label: "Tour de Lima",
    to: "/citytour",
    icon: Car,
    description: "Turismo local",
    end: true,
    moduleCode: "citytour",
  },
  {
    label: "Paquete de Viaje",
    to: "/paquete-viaje",
    icon: Briefcase,
    description: "Formulario de itinerario",
    end: true,
    moduleCode: "paquete_viaje",
  },

  {
    label: "Mantenimiento",
    to: "/maintenance",
    icon: Wrench,
    description: "Catálogos y usuarios",
    moduleCode: "maintenance",
  },
  {
    label: "Seguridad",
    to: "/seguridad",
    icon: ShieldCheck,
    description: "Áreas y usuarios",
    moduleCode: "security",
  
  },
];
