import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";

export type TransferPayload = {
  fechaEmision: string;
  fechaInicio: string;
  fechaFin: string;
  programa: string;
  counterId: number;
  agenciaId: number | null;
  agencia: string;
  contacto: string;
  telefono: string;
  telefonoPax: string;
  email: string;
  moneda: "SOLES" | "DOLARES";
  pasajeros: {
    nombres: string;
    pasaporte: string;
    nacionalidad: string;
    telefono: string;
    fechaNacimiento: string | null;
    tipoPasajero: string;
    totalTipoPasajero: number;
  }[];
  dias: { fecha: string; destino: string; hotel: string; tipoUnidad: string; tipoTraslado: string; detalle: string; hora: string; precio: number }[];
};

export async function saveTransfer(payload: TransferPayload): Promise<number> {
  const result = await apiRequest<{ idTraslado: number }>({
    url: `${API_BASE_URL}/Programacion/traslados`,
    method: "POST",
    data: payload,
  });
  return result.idTraslado;
}
