import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";

export type Guia = {
  idGuia: number;
  idRegion: number;
  region: string;
  nombre: string;
  dni: string;
  telefono: string;
  clasificacion: string;
  observaciones: string;
  fechaRegistro: string;
  activo: boolean;
};

export type SaveGuiaPayload = Omit<Guia, "fechaRegistro">;

const listEndpoint = `${API_BASE_URL}/Guia/list`;
const saveEndpoint = `${API_BASE_URL}/Guia/guardar`;

const mapGuia = (item: Record<string, unknown>): Guia => ({
  idGuia: Number(item.idGuia ?? item.IdGuia ?? 0),
  idRegion: Number(item.idRegion ?? item.IdRegion ?? 0),
  region: String(item.region ?? item.Region ?? ""),
  nombre: String(item.nombre ?? item.Nombre ?? ""),
  dni: String(item.dni ?? item.Dni ?? ""),
  telefono: String(item.telefono ?? item.Telefono ?? ""),
  clasificacion: String(item.clasificacion ?? item.Clasificacion ?? ""),
  observaciones: String(item.observaciones ?? item.Observaciones ?? ""),
  fechaRegistro: String(item.fechaRegistro ?? item.FechaRegistro ?? ""),
  activo: Boolean(item.activo ?? item.Activo),
});

export const useGuias = () => {
  const [guias, setGuias] = useState<Guia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const response = await fetch(listEndpoint, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: unknown = await response.json();
      setGuias(Array.isArray(data) ? data.map((item) => mapGuia(item as Record<string, unknown>)) : []);
      setError(null);
    } catch (cause) {
      if ((cause as { name?: string }).name !== "AbortError") {
        setError(cause as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const saveGuia = useCallback(async (payload: SaveGuiaPayload) => {
    const response = await fetch(saveEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error((await response.text()).trim() || `HTTP ${response.status}`);
    return Number(await response.text());
  }, []);

  return { guias, isLoading, error, refresh, saveGuia };
};
