import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";

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

const SALES_CHANNEL_LIST_ENDPOINT = `${API_BASE_URL}/Canal/list`;
const SALES_CHANNEL_SAVE_ENDPOINT = `${API_BASE_URL}/Canal/guardar-auxiliar`;
const SALES_CHANNEL_DELETE_ENDPOINT = `${API_BASE_URL}/Canal/auxiliar`;

const parseRawPayload = (rawText: string): unknown => {
  const trimmed = String(rawText ?? "").trim();
  if (!trimmed) return [];

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

const normalizeText = (value: unknown) => String(value ?? "").trim();

const parseSalesChannelsListPayload = (payload: unknown): SalesChannelDetail[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload
      .map((item, index) => {
        const row = item as Record<string, unknown>;
        const idCandidate =
          row.idCanal ??
          row.IdCanal ??
          row.idAuxiliar ??
          row.IdAuxiliar ??
          row.id ??
          row.Id;
        const parsedId = Number(idCandidate);
        const idCanal = Number.isFinite(parsedId) ? parsedId : 0;
        const canalNombre = normalizeText(
          row.canalNombre ?? row.CanalNombre ?? row.auxiliar ?? row.Auxiliar,
        );

        if (!canalNombre) return null;

        return {
          id: idCanal > 0 ? idCanal : index + 1,
          idCanal,
          canalNombre,
          contacto: normalizeText(row.contacto ?? row.Contacto) || undefined,
          telefono: normalizeText(row.telefono ?? row.Telefono) || undefined,
          email: normalizeText(row.email ?? row.Email) || undefined,
        } as SalesChannelDetail;
      })
      .filter((item): item is SalesChannelDetail => Boolean(item));
  }

  if (typeof payload === "object") {
    const maybeData = (payload as { data?: unknown }).data;
    if (maybeData !== undefined) {
      return parseSalesChannelsListPayload(maybeData);
    }
    return [];
  }

  if (typeof payload !== "string") return [];

  const normalizedRaw = payload.replace(/Â¬/g, "¬").trim();
  if (!normalizedRaw || normalizedRaw === "~") return [];

  const rows = normalizedRaw
    .split("¬")
    .map((row) => row.trim())
    .filter((row) => Boolean(row) && row !== "~");

  return rows
    .map((row, index) => {
      const parts = row.split("|");
      const parsedId = Number(normalizeText(parts[0]));
      const idCanal = Number.isFinite(parsedId) ? parsedId : 0;
      const canalNombre = normalizeText(parts[1]);

      if (!canalNombre) return null;

      const contacto = normalizeText(parts[2]);
      const telefono = normalizeText(parts[3]);
      const email = normalizeText(parts[4]);

      return {
        id: idCanal > 0 ? idCanal : index + 1,
        idCanal,
        canalNombre,
        contacto: contacto || undefined,
        telefono: telefono || undefined,
        email: email || undefined,
      } as SalesChannelDetail;
    })
    .filter((item): item is SalesChannelDetail => Boolean(item));
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

const parseDeleteResponse = (rawResponse: string): boolean => {
  const trimmed = String(rawResponse ?? "").trim();
  if (!trimmed) return true;

  const normalized = trimmed.toLowerCase();
  if (normalized === "true" || normalized === "ok") return true;
  if (normalized === "false") return false;

  const directNumber = Number(trimmed);
  if (Number.isFinite(directNumber)) return directNumber > 0;

  const parsed = parseRawPayload(trimmed);

  if (typeof parsed === "boolean") return parsed;
  if (typeof parsed === "number") return parsed > 0;
  if (parsed && typeof parsed === "object") {
    const blob = parsed as Record<string, unknown>;
    const successCandidate =
      blob.success ??
      blob.Success ??
      blob.result ??
      blob.Result ??
      blob.ok ??
      blob.Ok;

    if (typeof successCandidate === "boolean") return successCandidate;
    if (typeof successCandidate === "number") return successCandidate > 0;
    if (typeof successCandidate === "string") {
      const normalizedSuccess = successCandidate.trim().toLowerCase();
      if (normalizedSuccess === "true" || normalizedSuccess === "ok") return true;
      if (normalizedSuccess === "false") return false;
      const parsedSuccessNumber = Number(normalizedSuccess);
      if (Number.isFinite(parsedSuccessNumber)) return parsedSuccessNumber > 0;
    }
  }

  return false;
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
      const mapped = parseSalesChannelsListPayload(parsed);

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

  const deleteChannel = useCallback(async (idAuxiliar: number) => {
    const id = Number(idAuxiliar);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error("ID de canal invalido para eliminar.");
    }

    const response = await fetch(`${SALES_CHANNEL_DELETE_ENDPOINT}/${id}`, {
      method: "DELETE",
      headers: {
        accept: "text/plain, application/json",
      },
    });

    if (!response.ok) {
      const errorText = (await response.text()).trim();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    if (response.status === 204) return true;

    const responseText = await response.text();
    const success = parseDeleteResponse(responseText);
    if (!success) {
      throw new Error("No se pudo eliminar el canal de venta.");
    }

    return true;
  }, []);

  return { channels, isLoading, error, refresh, saveChannel, deleteChannel };
};
