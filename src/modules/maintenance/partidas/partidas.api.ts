import type { DeparturePoint } from "@/types/maintenance";
import { API_BASE_URL } from "@/config";

const PARTIDA_LIST_ENDPOINT = `${API_BASE_URL}/Partida/list`;

export const partidasQueryKey = ["partidas"] as const;

const mapApiPartida = (item: any): DeparturePoint => ({
  id: Number(item?.idParti ?? item?.id ?? 0) || 0,
  destination:
    String(item?.destino ?? item?.productoNombre ?? "")
      .trim(),
  pointName: String(item?.partidas ?? item?.puntoPartida ?? "").trim(),
  horaPartida: String(item?.horaPartida ?? "").trim(),
  region: String(item?.region ?? "").trim(),
  productId: Number(item?.idProducto ?? item?.productoId ?? 0) || 0,
});

export const fetchPartidasApi = async (): Promise<DeparturePoint[]> => {
  try {
    const response = await fetch(PARTIDA_LIST_ENDPOINT, {
      headers: {
        accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Listado de partidas falló: ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("El listado de partidas debe ser un arreglo");
    }
    return payload.map(mapApiPartida);
  } catch (error) {
    console.error("Error fetching partidas", error);
    return [];
  }
};
