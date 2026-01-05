import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  BarChart2,
  Package,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description?: string;
};

export const navigationItems: NavigationItem[] = [
  {
    label: "Panel",
    to: "/",
    icon: LayoutDashboard,
    description: "Resumen general",
  },

  {
    label: "Paquetes",
    to: "/package",
    icon: Package,
    description: "Gestión de paquetes",
  },
];
