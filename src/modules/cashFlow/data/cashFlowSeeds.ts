import type { CashFlowRecord, EncargadoOption } from "../types";

const denominaciones = [
  200.0, 100.0, 50.0, 20.0, 10.0, 5.0, 2.0, 1.0, 0.5, 0.2, 0.1,
];

const buildConteo = (counts: number[]) =>
  denominaciones.map((denominacion, index) => ({
    denominacion,
    cantidad: counts[index] ?? 0,
  }));

const encargados: EncargadoOption[] = [
  { label: "Lina Torres", value: "300" },
  { label: "Marco Luyo", value: "301" },
  { label: "Valentina Silva", value: "302" },
];

const cashFlowSeeds: CashFlowRecord[] = [
  {
    id: 1,
    createdAt: "2026-01-24T07:40:00.000Z",
    caja: "Caja Principal",
    encargado: encargados[0],
    sencillo: 120,
    estado: "ABIERTA",
    fechaApertura: "2026-01-24T07:40:00.000Z",
    fechaCierre: "",
    observaciones: "Se inició la operación sin novedades. Se espera cierre al final del turno.",
    conteoMonedas: buildConteo([2, 5, 9, 6, 8, 7, 4, 12, 5, 2, 1]),
    ingresos: [
      { id: 11, descripcion: "Venta presencial", importe: 860 },
      { id: 12, descripcion: "Venta virtual", importe: 430 },
    ],
    gastos: [
      { id: 13, descripcion: "Devolución cliente", importe: 120 },
      { id: 14, descripcion: "Gastos operativos", importe: 80 },
    ],
    ventaTotal: { efectivo: 1070, tarjeta: 430, deposito: 190 },
  },
  {
    id: 2,
    createdAt: "2026-01-23T14:10:00.000Z",
    caja: "Caja 2 - Sur",
    encargado: encargados[1],
    sencillo: 80,
    estado: "CERRADA",
    fechaApertura: "2026-01-23T07:30:00.000Z",
    fechaCierre: "2026-01-23T15:00:00.000Z",
    observaciones: "Caja cerrada con sobrante de S/ 40. Se anotó en libro físico.",
    conteoMonedas: buildConteo([1, 4, 5, 8, 11, 6, 5, 10, 3, 1, 2]),
    ingresos: [
      { id: 21, descripcion: "Tour Full Day", importe: 960 },
      { id: 22, descripcion: "Carrito de snacks", importe: 180 },
      { id: 23, descripcion: "Merchandising", importe: 120 },
    ],
    gastos: [
      { id: 24, descripcion: "Compra de insumos", importe: 210 },
      { id: 25, descripcion: "Devolución parcial", importe: 50 },
    ],
    ventaTotal: { efectivo: 1180, tarjeta: 520, deposito: 120 },
  },
  {
    id: 3,
    createdAt: "2026-01-22T09:10:00.000Z",
    caja: "Caja Movil",
    encargado: encargados[2],
    sencillo: 45,
    estado: "ABIERTA",
    fechaApertura: "2026-01-22T06:55:00.000Z",
    fechaCierre: "",
    observaciones: "Operación enfocada en tours de la mañana. Cierre pendiente.",
    conteoMonedas: buildConteo([0, 2, 4, 9, 7, 5, 3, 8, 2, 1, 1]),
    ingresos: [
      { id: 31, descripcion: "City tour 9am", importe: 620 },
      { id: 32, descripcion: "City tour 11am", importe: 720 },
      { id: 33, descripcion: "Venta on-site", importe: 210 },
    ],
    gastos: [{ id: 34, descripcion: "Servicios externos", importe: 140 }],
    ventaTotal: { efectivo: 890, tarjeta: 260, deposito: 210 },
  },
];

const findCashFlowRecord = (id: number) =>
  cashFlowSeeds.find((record) => record.id === id);

export { cashFlowSeeds, findCashFlowRecord };
