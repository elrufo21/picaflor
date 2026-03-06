import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";

export type TransporteDetail = {
  idTransporte: number;
  clasificacion: string;
  nombreTransporte: string;
  telefono: string;
  contacto: string;
  categoria: string;
  fechaRegistro: string;
  activo: boolean;
};

export type SaveTransportePayload = {
  idTransporte: number;
  clasificacion: string;
  nombreTransporte: string;
  telefono: string;
  contacto: string;
  categoria: string;
  fechaRegistro: string | null;
  activo: boolean;
};

const TRANSPORTE_LIST_ENDPOINT = `${API_BASE_URL}/Transporte/list`;
const TRANSPORTE_SAVE_ENDPOINT = `${API_BASE_URL}/Transporte/guardar`;

const parseRawPayload = (rawText: string): unknown => {
  const trimmed = String(rawText ?? "").trim();
  if (!trimmed) return [];

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

const normalizeText = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return normalized.toLowerCase() === "null" ? "" : normalized;
};

const parseBoolean = (value: unknown) => {
  const normalized = normalizeText(value).toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "si";
};

const parseTransportesListPayload = (payload: unknown): TransporteDetail[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        const row = item as Record<string, unknown>;
        const idTransporte = Number(
          row.idTransporte ?? row.IdTransporte ?? row.id ?? row.Id ?? 0,
        );
        if (!Number.isFinite(idTransporte) || idTransporte <= 0) return null;

        return {
          idTransporte,
          clasificacion: normalizeText(
            row.clasificacion ?? row.Clasificacion ?? "",
          ),
          nombreTransporte: normalizeText(
            row.nombreTransporte ?? row.NombreTransporte ?? "",
          ),
          telefono: normalizeText(row.telefono ?? row.Telefono ?? ""),
          contacto: normalizeText(row.contacto ?? row.Contacto ?? ""),
          categoria: normalizeText(row.categoria ?? row.Categoria ?? ""),
          fechaRegistro: normalizeText(
            row.fechaRegistro ?? row.FechaRegistro ?? "",
          ),
          activo: parseBoolean(row.activo ?? row.Activo ?? false),
        } as TransporteDetail;
      })
      .filter((item): item is TransporteDetail => Boolean(item));
  }

  if (typeof payload === "object") {
    const maybeData = (payload as { data?: unknown }).data;
    if (maybeData !== undefined) {
      return parseTransportesListPayload(maybeData);
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
    .map((row) => {
      const parts = row.split("|");
      const idTransporte = Number(normalizeText(parts[0]));
      if (!Number.isFinite(idTransporte) || idTransporte <= 0) return null;

      return {
        idTransporte,
        clasificacion: normalizeText(parts[1]),
        nombreTransporte: normalizeText(parts[2]),
        telefono: normalizeText(parts[3]),
        contacto: normalizeText(parts[4]),
        categoria: normalizeText(parts[5]),
        fechaRegistro: normalizeText(parts[6]),
        activo: parseBoolean(parts[7]),
      } as TransporteDetail;
    })
    .filter((item): item is TransporteDetail => Boolean(item));
};

const parseSavedTransporteId = (rawResponse: string, fallbackId = 0): number => {
  const trimmed = String(rawResponse ?? "").trim();
  const normalized = trimmed.toLowerCase();

  if (normalized === "true" || normalized === "ok") {
    return Number.isFinite(fallbackId) ? Math.max(0, fallbackId) : 0;
  }

  const directNumber = Number(trimmed);
  if (Number.isFinite(directNumber)) return directNumber;

  const parsed = parseRawPayload(trimmed);
  if (parsed && typeof parsed === "object") {
    const blob = parsed as Record<string, unknown>;
    const idCandidate =
      blob.idTransporte ??
      blob.IdTransporte ??
      blob.id ??
      blob.Id ??
      blob.transporteId;

    const parsedId = Number(idCandidate);
    if (Number.isFinite(parsedId)) return parsedId;
  }

  throw new Error("No se pudo interpretar el ID del transporte guardado.");
};

export const useTransportes = () => {
  const [transportes, setTransportes] = useState<TransporteDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTransportes = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);

    try {
      const response = await fetch(TRANSPORTE_LIST_ENDPOINT, {
        headers: { accept: "application/json, text/plain" },
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawText = await response.text();
      const parsed = parseRawPayload(rawText);
      const mapped = parseTransportesListPayload(parsed);

      setTransportes(mapped);
      setError(null);
    } catch (fetchError) {
      if ((fetchError as { name?: string }).name === "AbortError") return;

      console.error("fetchTransportes error", fetchError);
      setError(fetchError as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadTransportes(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadTransportes]);

  const refresh = useCallback(async () => {
    await loadTransportes();
  }, [loadTransportes]);

  const saveTransporte = useCallback(async (payload: SaveTransportePayload) => {
    const response = await fetch(TRANSPORTE_SAVE_ENDPOINT, {
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
    return parseSavedTransporteId(responseText, Number(payload.idTransporte || 0));
  }, []);

  return { transportes, isLoading, error, refresh, saveTransporte };
};
