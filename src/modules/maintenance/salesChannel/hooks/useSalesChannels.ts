import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";
import { parseCanalPayload } from "@/modules/fullday/hooks/canalUtils";

export type SalesChannelDetail = {
  id: number;
  idCanal: number;
  canalNombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
};

export type SaveSalesChannelPayload = {
  idAuxiliar: number;
  auxiliar: string;
  telefono: string;
  contacto: string;
  email: string;
};

const SALES_CHANNEL_LIST_ENDPOINT = `${API_BASE_URL}/Programacion/traerCanalVentaDetalle`;
const SALES_CHANNEL_SAVE_ENDPOINT = `${API_BASE_URL}/Canal/guardar-auxiliar`;

const parseRawPayload = (rawText: string): unknown => {
  const trimmed = String(rawText ?? "").trim();
  if (!trimmed) return [];

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

const parseSavedCanalId = (rawResponse: string): number => {
  const trimmed = String(rawResponse ?? "").trim();
  const directNumber = Number(trimmed);

  if (Number.isFinite(directNumber)) {
    return directNumber;
  }

  const parsed = parseRawPayload(trimmed);
  if (parsed && typeof parsed === "object") {
    const blob = parsed as Record<string, unknown>;
    const idCandidate =
      blob.idCanal ??
      blob.IdCanal ??
      blob.idAuxiliar ??
      blob.IdAuxiliar ??
      blob.id ??
      blob.Id ??
      blob.canalId;

    const parsedId = Number(idCandidate);
    if (Number.isFinite(parsedId)) {
      return parsedId;
    }
  }

  throw new Error("No se pudo interpretar el ID del canal guardado.");
};

const parseChannels = (payload: unknown): SalesChannelDetail[] => {
  const mapped = parseCanalPayload(payload);

  return mapped
    .map((item, index) => {
      const parsedId = Number(item.value);
      const idCanal = Number.isFinite(parsedId) ? parsedId : 0;
      const canalNombre = String(
        item.auxiliar ?? item.label ?? item.value ?? "",
      ).trim();

      if (!canalNombre) return null;

      return {
        id: idCanal > 0 ? idCanal : index + 1,
        idCanal,
        canalNombre,
        contacto: item.contacto,
        telefono: item.telefono,
        email: item.email,
      } as SalesChannelDetail;
    })
    .filter((item): item is SalesChannelDetail => Boolean(item));
};

export const useSalesChannels = () => {
  const [channels, setChannels] = useState<SalesChannelDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadChannels = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);

    try {
      const response = await fetch(SALES_CHANNEL_LIST_ENDPOINT, {
        headers: { accept: "application/json, text/plain" },
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawText = await response.text();
      const parsed = parseRawPayload(rawText);
      const source =
        parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? ((parsed as { data?: unknown }).data ?? parsed)
          : parsed;
      const mapped = parseChannels(source);

      setChannels(mapped);
      setError(null);
    } catch (fetchError) {
      if ((fetchError as { name?: string }).name === "AbortError") return;

      console.error("fetchSalesChannels error", fetchError);
      setError(fetchError as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadChannels(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadChannels]);

  const refresh = useCallback(async () => {
    await loadChannels();
  }, [loadChannels]);

  const saveChannel = useCallback(async (payload: SaveSalesChannelPayload) => {
    const response = await fetch(SALES_CHANNEL_SAVE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "text/plain, application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = (await response.text()).trim();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const responseText = await response.text();
    return parseSavedCanalId(responseText);
  }, []);

  return { channels, isLoading, error, refresh, saveChannel };
};
