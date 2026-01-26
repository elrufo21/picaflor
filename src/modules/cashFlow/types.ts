export type CashFlowStatus = "ABIERTA" | "CERRADA";

export type Movimiento = {
  id: number;
  descripcion: string;
  importe: number;
};

export type ConteoMoneda = {
  cantidad: number | "";
  denominacion: number;
};

export type VentaTotal = {
  efectivo: number;
  tarjeta: number;
  deposito: number;
};

export type EncargadoOption = {
  label: string;
  value: string;
  data?: any;
};

export type CashFlowFormValues = {
  caja: string;
  encargado: EncargadoOption | null;
  sencillo: number;
  estado: CashFlowStatus;
  fechaApertura: string;
  fechaCierre: string;
  observaciones: string;
  conteoMonedas: ConteoMoneda[];
  ingresos: Movimiento[];
  gastos: Movimiento[];
  ventaTotal: VentaTotal;
};

export type CashFlowRecord = CashFlowFormValues & {
  id: number;
  createdAt: string;
};
