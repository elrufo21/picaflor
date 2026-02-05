import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";

export const actividadesAdiQueryKey = ["actividades-adi"] as const;
const ACTIVIDADES_LIST_ENDPOINT = `${API_BASE_URL}/ActividadesAdi/lista`;
const ACTIVIDADES_REGISTER_ENDPOINT = `${API_BASE_URL}/ActividadesAdi/register`;
const ACTIVIDADES_UPDATE_ENDPOINT = (id: number) =>
  `${API_BASE_URL}/ActividadesAdi/${id}`;
const ACTIVIDADES_DELETE_ENDPOINT = (id: number) =>
  `${API_BASE_URL}/ActividadesAdi/${id}`;

export type ActividadAdi = {
  id: number;
  destino: string;
  actividad: string;
  precioSol: number;
  entradaSol: number;
  precioDol: number;
  entradaDol: number;
  region?: string | null;
  idProducto?: number | null;
  descripcion?: string;
};

export type ActividadAdiRequest = {
  idActi?: number;
  actividades: string;
  precio: number;
  entrada: number;
  precioDol: number;
  entradaDol: number;
  region: string;
  idProducto: number;
  descripcion: string;
};

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapActividad = (item: any): ActividadAdi => ({
  id: Number(item?.id ?? item?.idActi ?? 0) || 0,
  destino: String(item?.destino ?? ""),
  actividad: String(item?.actividad ?? ""),
  precioSol: toNumber(item?.precioSol ?? item?.precio),
  entradaSol: toNumber(item?.entradaSol ?? item?.entrada),
  precioDol: toNumber(item?.precioDol ?? 0),
  entradaDol: toNumber(item?.entradaDol ?? 0),
  region: item?.region ?? null,
  idProducto: item?.idProducto ? Number(item.idProducto) : null,
  descripcion: String(item?.descripcion ?? ""),
});

export const fetchActividadesAdiApi = async (): Promise<ActividadAdi[]> => {
  try {
    const response = await fetch(ACTIVIDADES_LIST_ENDPOINT, {
      headers: {
        accept: "text/plain",
      },
    });
    if (!response.ok) {
      throw new Error("Listado de actividades adi falló:");
    }
    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("El listado de actividades debe ser un arreglo");
    }

    return payload.map(mapActividad);
  } catch (error) {
    console.error("Error fetching actividades adi", error);
    return [];
  }
};

export const registerActividadAdiApi = async (payload: ActividadAdiRequest) => {
  return apiRequest({
    url: ACTIVIDADES_REGISTER_ENDPOINT,
    method: "POST",
    data: payload,
    config: {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    },
  });
};

export const updateActividadAdiApi = async (payload: ActividadAdiRequest) => {
  if (!payload.idActi) {
    throw new Error("El payload debe incluir idActi para actualizar");
  }
  return apiRequest({
    url: ACTIVIDADES_UPDATE_ENDPOINT(payload.idActi),
    method: "PUT",
    data: payload,
    config: {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    },
  });
};

export const deleteActividadAdiApi = async (id: number) => {
  return apiRequest({
    url: ACTIVIDADES_DELETE_ENDPOINT(id),
    method: "DELETE",
    config: {
      headers: {
        Accept: "*/*",
      },
    },
  });
};
