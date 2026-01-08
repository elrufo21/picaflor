import type { PackageItem } from "../store/packageStore";
export type CreateProgramacionPayload = {
  idDetalle: number;
  idProducto: number;
  destino: string;
  fecha: string; // YYYY-MM-DD
  cantMax: number;
  region: string;
};
const API_URL = "http://localhost:5000/api/v1/Programacion";

export async function fetchPackages(fecha?: string): Promise<PackageItem[]> {
  const params = new URLSearchParams();

  // Si NO mandas fecha → backend usa now()
  if (fecha) {
    // Normalizar a YYYY-MM-DD si vienen ISO con hora (p.e. 2026-07-02T00:00:00.000Z)
    const fechaParam =
      fecha.includes("T") || fecha.length > 10 ? fecha.slice(0, 10) : fecha;
    params.append("fecha", fechaParam);
  }

  const url = `${API_URL}/list${params.toString() ? `?${params}` : ""}`;

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

export async function createProgramacion(payload: CreateProgramacionPayload) {
  const res = await fetch(
    "http://localhost:5000/api/v1/Programacion/registerProg",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error al crear programación");
  }

  return res.json();
}

export async function deleteProgramacion(id: number): Promise<void> {
  const res = await fetch(`http://localhost:5000/api/v1/Programacion/${id}`, {
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
export const editarCantMax = async (listaOrden: string) => {
  const res = await fetch(
    "http://localhost:5000/api/v1/Programacion/editar-cant-max",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        listaOrden,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error al editar cantidad máxima");
  }

  return res.json();
};
