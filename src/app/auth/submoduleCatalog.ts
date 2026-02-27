export type SubmoduleOption = {
  code: string;
  label: string;
  detail?: string;
};

export const SUBMODULE_OPTIONS: SubmoduleOption[] = [
  {
    code: "maintenance.categories",
    label: "Mantenimiento - Categorias",
    detail: "Permite abrir la pantalla de categorias.",
  },
  {
    code: "maintenance.products",
    label: "Mantenimiento - Productos",
    detail: "Permite abrir la pantalla de productos.",
  },
  {
    code: "maintenance.actividades",
    label: "Mantenimiento - Actividades adicionales",
    detail: "Permite abrir la pantalla de actividades adicionales.",
  },
  {
    code: "maintenance.areas",
    label: "Mantenimiento - Areas",
    detail: "Permite abrir la pantalla de areas.",
  },
  {
    code: "maintenance.hotels",
    label: "Mantenimiento - Hoteles",
    detail: "Permite abrir la pantalla de hoteles.",
  },
  {
    code: "maintenance.partidas",
    label: "Mantenimiento - Puntos de partida",
    detail: "Permite abrir la pantalla de puntos de partida.",
  },
  {
    code: "maintenance.sales_channel",
    label: "Mantenimiento - Canal de venta",
    detail: "Permite abrir la pantalla de canal de venta.",
  },
  {
    code: "maintenance.employees",
    label: "Mantenimiento - Empleados",
    detail: "Permite abrir la pantalla de empleados.",
  },
  {
    code: "maintenance.users",
    label: "Mantenimiento - Usuarios",
    detail: "Permite abrir la pantalla de usuarios.",
  },
  {
    code: "fullday.programacion_liquidaciones.btn_agregar",
    label: "Full Day - Boton Agregar",
    detail: "Habilita el boton Agregar en Programacion de liquidaciones.",
  },
  {
    code: "fullday.programacion_liquidaciones.btn_guardar",
    label: "Full Day - Boton Guardar",
    detail: "Habilita el boton Guardar en Programacion de liquidaciones.",
  },
  {
    code: "citytour.programacion_liquidaciones.btn_agregar",
    label: "City Tour - Boton Agregar",
    detail: "Habilita el boton Agregar en Programacion de liquidaciones.",
  },
  {
    code: "citytour.programacion_liquidaciones.btn_guardar",
    label: "City Tour - Boton Guardar",
    detail: "Habilita el boton Guardar en Programacion de liquidaciones.",
  },
];
