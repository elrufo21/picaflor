import type { PackageItem } from "../store/cityTourStore";
import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";
export type CreateProgramacionPayload = {
  idDetalle: number;
  idProducto: number;
  destino: string;
  fecha: string; // YYYY-MM-DD
  cantMax: number;
  region: string;
};
const PROGRAMACION_API_URL = `${API_BASE_URL}/Programacion`;

export async function fetchPackages(fecha?: string): Promise<PackageItem[]> {
  const params = new URLSearchParams();

  // Si NO mandas fecha → backend usa now()
  if (fecha) {
    // Normalizar a YYYY-MM-DD si vienen ISO con hora (p.e. 2026-07-02T00:00:00.000Z)
    const fechaParam =
      fecha.includes("T") || fecha.length > 10 ? fecha.slice(0, 10) : fecha;
    params.append("fecha", fechaParam);
  }

  const url = `${PROGRAMACION_API_URL}/list-city-tours${params.toString() ? `?${params}` : ""}`;

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Error al obtener la programación");
  }

  return res.json();
}

const formatDateForListado = (value?: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${month}-${day}-${year}`;
  }
  return trimmed;
};

export async function fetchListadoByProducto(
  fecha: string | undefined,
  idProducto: number,
) {
  if (!idProducto) return [];
  const dateValue = formatDateForListado(fecha);
  const payload = {
    valores: `${dateValue}|${dateValue}|${idProducto}`,
  };

  const res = await fetch(`${API_BASE_URL}/Programacion/lista-city-tour-web`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error al obtener el listado");
  }

  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return [];
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

export async function createProgramacion(payload: CreateProgramacionPayload) {
  const res = await fetch(`${PROGRAMACION_API_URL}/registerProg`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error al crear programación");
  }

  return res.json();
}

export async function deleteProgramacion(id: number): Promise<void> {
  const res = await fetch(`${PROGRAMACION_API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      accept: "*/*",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error al eliminar la programación");
  }
}
export const editarCantMax = async (Valores: string) => {
  const res = await fetch(`${PROGRAMACION_API_URL}/editar-cant-max`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      Valores,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error al editar cantidad máxima");
  }

  return res.json();
};

export async function fetchLiquidaciones(
  areaId: number | string,
  usuarioId: number | string,
) {
  try {
    const response = await apiRequest<string>({
      url: `${API_BASE_URL}/Programacion/listar-liquidaciones`,
      method: "POST",
      data: {
        areaId,
        usuarioId,
      },
      config: {
        headers: {
          accept: "text/plain",
          "Content-Type": "application/json",
        },
        responseType: "text",
      },
      fallback: "",
    });
    return response ?? "";
  } catch (error) {
    console.error("Error al listar liquidaciones", error);
    throw error;
  }
}

export async function fetchPedidosFecha(payload: {
  fechaInicio: string;
  fechaFin: string;
  areaId: number | string;
  usuarioId: number | string;
}) {
  try {
    const response = await apiRequest<string>({
      url: `${API_BASE_URL}/Programacion/lista-pedidos-fecha`,
      method: "POST",
      data: payload,
      config: {
        headers: {
          accept: "text/plain",
          "Content-Type": "application/json",
        },
        responseType: "text",
      },
      fallback: "",
    });
    return response ?? "";
  } catch (error) {
    console.error("Error al listar pedidos por fecha", error);
    throw error;
  }
}
