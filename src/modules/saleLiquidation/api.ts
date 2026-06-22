import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";

const PROGRAMACION_API_URL = `${API_BASE_URL}/Programacion`;

export type SaleLiquidationRow = {
  notaId: number;
  documento: string;
  fechaRegistro: string;
  fechaViaje: string;
  cliente: string;
  telefono: string;
  servicio: string;
  auxiliar: string;
  condicion: string;
  formaPago: string;
  moneda: string;
  total: number;
  acuenta: number;
  saldo: number;
  estado: string;
  permiteCredito: boolean;
  counter: string;
};

export type SaleLiquidationPayment = {
  liquidaId: number;
  recibido: string;
  formaPago: string;
  moneda: string;
  tipoCambio: number;
  importe: number;
  entidadBancaria: string;
  nroOperacion: string;
  acuenta: number;
  usuario?: string;
  imagen?: string;
  estado: string;
};

export type SaleLiquidationDetail = SaleLiquidationRow & {
  clienteId?: number;
  pagos: SaleLiquidationPayment[];
};

export type SaveLiquidationPaymentPayload = {
  liquidaId: number;
  notaId: number;
  recibido: string;
  formaPago: string;
  moneda: string;
  tipoCambio: number;
  importe: number;
  acuenta?: number;
  entidadBancaria?: string;
  nroOperacion?: string;
  imagen?: string;
  usuario: string;
};

const toNumber = (value: string) => {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const toBoolean = (value: string) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "si";
};

const parseRow = (row: string): SaleLiquidationRow | null => {
  const cells = row.split("|");
  if (cells.length < 17) return null;

  return {
    notaId: toNumber(cells[0]),
    documento: cells[1] ?? "",
    fechaRegistro: cells[2] ?? "",
    fechaViaje: cells[3] ?? "",
    cliente: cells[4] ?? "",
    telefono: cells[5] ?? "",
    servicio: cells[6] ?? "",
    auxiliar: cells[7] ?? "",
    condicion: cells[8] ?? "",
    formaPago: cells[9] ?? "",
    moneda: cells[10] ?? "",
    total: toNumber(cells[11]),
    acuenta: toNumber(cells[12]),
    saldo: toNumber(cells[13]),
    estado: cells[14] ?? "",
    permiteCredito: toBoolean(cells[15]),
    counter: cells[16] ?? "",
  };
};

export const parsePendingLiquidations = (payload: string) =>
  String(payload ?? "")
    .split("¬")
    .map((row) => row.trim())
    .filter(Boolean)
    .map(parseRow)
    .filter((row): row is SaleLiquidationRow => Boolean(row));

export async function fetchPendingLiquidations(
  areaId: number | string,
  usuarioId: number | string,
) {
  const response = await apiRequest<string>({
    url: `${PROGRAMACION_API_URL}/listar-liquidaciones-pendientes-pago`,
    method: "POST",
    data: { areaId, usuarioId },
    config: {
      headers: {
        accept: "text/plain",
        "Content-Type": "application/json",
      },
      responseType: "text",
    },
    fallback: "",
  });

  return parsePendingLiquidations(String(response ?? ""));
}

export async function fetchLiquidationPaymentDetail(notaId: number | string) {
  return apiRequest<SaleLiquidationDetail>({
    url: `${PROGRAMACION_API_URL}/liquidacion-pago-detalle/${encodeURIComponent(
      String(notaId),
    )}`,
    method: "GET",
  });
}

export async function saveLiquidationPayment(
  payload: SaveLiquidationPaymentPayload,
) {
  const result = await apiRequest<string | boolean>({
    url: `${PROGRAMACION_API_URL}/pagar-liquidacion`,
    method: "POST",
    data: payload,
    config: {
      headers: {
        accept: "text/plain",
        "Content-Type": "application/json",
      },
      responseType: "text",
    },
  });
  if (result === true || String(result).trim().toLowerCase() === "true") return true;
  throw new Error(String(result || "No se pudo registrar el pago."));
}

export async function deleteLiquidationPayment(
  liquidaId: number,
  notaId: number,
) {
  const result = await apiRequest<string | boolean>({
    url: `${PROGRAMACION_API_URL}/eliminar-pago-liquidacion`,
    method: "POST",
    data: { liquidaId, notaId },
    config: {
      headers: {
        accept: "text/plain",
        "Content-Type": "application/json",
      },
      responseType: "text",
    },
  });
  if (result === true || String(result).trim().toLowerCase() === "true") return true;
  throw new Error(String(result || "No se pudo eliminar el pago."));
}
