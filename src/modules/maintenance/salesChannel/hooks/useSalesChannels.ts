import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";

export type SalesChannelDetail = {
  idCanal: number;
  canalNombre: string;
  region?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  precio1?: number;
  precio2?: number;
  precio3?: number;
};

const SALES_CHANNEL_ENDPOINT = `${API_BASE_URL}/Canal/detalle`;

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const pickValue = (blob: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(blob, key)) {
      return blob[key];
    }
  }
  return undefined;
};

const normalizeItem = (item: unknown): SalesChannelDetail | null => {
  if (!item || typeof item !== "object") return null;
  const blob = item as Record<string, unknown>;
  const normalized = {
    idCanal:
      parseNumber(
        pickValue(
          blob,
          "idCanal",
          "IdCanal",
          "Id",
          "id",
          "CanalId",
          "canalId",
        ),
      ) ?? 0,
    canalNombre:
      String(
        pickValue(
          blob,
          "canalNombre",
          "CanalNombre",
          "canal",
          "name",
          "descripcion",
          "Nombre",
        ) ?? "",
      )
        .trim(),
    region:
      String(
        pickValue(blob, "region", "Region", "reg", "Reg") ?? "",
      ).trim() || undefined,
    contacto:
      String(
        pickValue(blob, "contacto", "Contacto", "Contact") ?? "",
      ).trim() || undefined,
    telefono:
      String(
        pickValue(blob, "telefono", "Telefono", "ContactoTelefono") ?? "",
      ).trim() || undefined,
    email:
      String(
        pickValue(blob, "email", "Email", "correo", "Correo") ?? "",
      ).trim() || undefined,
    precio1:
      parseNumber(
        pickValue(
          blob,
          "precio1",
          "Precio1",
          "precio_1",
          "precioUno",
        ),
      ) ?? undefined,
    precio2:
      parseNumber(
        pickValue(
          blob,
          "precio2",
          "Precio2",
          "precio_2",
          "precioDos",
        ),
      ) ?? undefined,
    precio3:
      parseNumber(
        pickValue(
          blob,
          "precio3",
          "Precio3",
          "precio_3",
          "precioTres",
        ),
      ) ?? undefined,
  };

  if (!normalized.canalNombre) return null;

  return normalized;
};

export const useSalesChannels = () => {
  const [channels, setChannels] = useState<SalesChannelDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadChannels = useCallback(
    async (signal: AbortSignal) => {
      setIsLoading(true);
      try {
        const response = await fetch(SALES_CHANNEL_ENDPOINT, {
          headers: { accept: "text/plain, application/json" },
          signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = await response.json();
        if (!Array.isArray(payload)) {
          throw new Error("Respuesta inesperada al cargar canales de venta");
        }

        const mapped = payload
          .map(normalizeItem)
          .filter((item): item is SalesChannelDetail => Boolean(item));

        setChannels(mapped);
        setError(null);
      } catch (fetchError) {
        if ((fetchError as { name?: string }).name === "AbortError") return;
        console.error("fetchSalesChannels error", fetchError);
        setError(fetchError as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadChannels(controller.signal);
    return () => controller.abort();
  }, [loadChannels]);

  const refresh = useCallback(() => {
    const controller = new AbortController();
    void loadChannels(controller.signal);
  }, [loadChannels]);

  return { channels, isLoading, error, refresh };
};
