import { API_BASE_URL } from "@/config";

export type MobilityLine = {
  fecha: string;
  hora: string;
  operacion: string;
  origen: string;
  destino: string;
  pax: string;
  precio: string;
  servicio: string;
  observacion: string;
  transporteId: string;
  guiaId: string;
};

export type MobilityLiquidationPayload = {
  counterId: string;
  canalId: string;
  cliente: string;
  telefono: string;
  condicion: string;
  moneda: string;
  formaPago: string;
  usuarioId: number;
  fechaRegistro: string;
  lineas: MobilityLine[];
};

const endpoint = `${API_BASE_URL}/Programacion/movilidad-liquidacion`;
const sanitize = (value: string | number | undefined | null) => String(value ?? "").replace(/[|¬;]/g, " ").trim();

const execute = async (valores: string) => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valores }),
  });
  const raw = (await response.text()).trim();
  let data = raw;
  try {
    const parsed = JSON.parse(raw);
    data = typeof parsed === "string" ? parsed : raw;
  } catch { /* respuesta de texto */ }
  if (!response.ok || data.startsWith("ERROR|")) throw new Error(data.replace(/^ERROR\|?/, "") || "No se pudo guardar la liquidación.");
  return data;
};

export const saveMobilityLiquidation = async ({
  counterId, canalId, cliente, telefono, condicion, moneda, formaPago, usuarioId, fechaRegistro, lineas,
}: MobilityLiquidationPayload) => {
  const total = lineas.reduce((sum, line) => sum + (Number(line.precio) || 0), 0).toFixed(2);
  const detail = lineas.map((line) => [
    line.fecha, line.hora, line.operacion, line.origen, line.destino, line.pax, line.precio,
    line.servicio, line.observacion, line.transporteId, line.guiaId,
  ].map(sanitize).join(";")).join("¬");
  return execute([
    "GUARDAR", "", sanitize(counterId), sanitize(canalId), sanitize(cliente), sanitize(telefono),
    sanitize(condicion), sanitize(moneda), sanitize(formaPago), total, usuarioId,
    sanitize(fechaRegistro), detail,
  ].join("|"));
};
