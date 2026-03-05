import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";

export type SalesChannelDetail = {
  id: number;
  idCanal: number;
  idAuxiliar?: number;
  ruc?: string;
  razonSocial?: string;
  canalNombre: string;
  direccion?: string;
  region?: string;
  celular?: string;
  contacto?: string;
  contacto02?: string;
  telefono?: string;
  email?: string;
  webSite?: string;
  clasificacion?: string;
  categoria?: string;
  fechaAniversario?: string;
  representanteLegal?: string;
  fechaNacimiento?: string;
  nota?: string;
};

export type SaveSalesChannelPayload = {
  idAuxiliar: number;
  auxiliar: string;
  ruc: string;
  razonSocial: string;
  direccion: string;
  region: string;
  telefono: string;
  celular: string;
  contacto: string;
  contacto02: string;
  email: string;
  webSite: string;
  clasificacion: string;
  categoria: string;
  fechaAniversario: string;
  representanteLegal: string;
  fechaNacimiento: string;
  nota: string;
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

const normalizeText = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return normalized.toLowerCase() === "null" ? "" : normalized;
};

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
          idAuxiliar: idCanal || undefined,
          ruc: normalizeText(row.ruc ?? row.RUC) || undefined,
          razonSocial:
            normalizeText(row.razonSocial ?? row.RazonSocial) || undefined,
          canalNombre,
          direccion: normalizeText(row.direccion ?? row.Direccion) || undefined,
          region: normalizeText(row.region ?? row.Region) || undefined,
          contacto: normalizeText(row.contacto ?? row.Contacto) || undefined,
          contacto02:
            normalizeText(row.contacto02 ?? row.Contacto02) || undefined,
          telefono: normalizeText(row.telefono ?? row.Telefono) || undefined,
          celular: normalizeText(row.celular ?? row.Celular) || undefined,
          email: normalizeText(row.email ?? row.Email) || undefined,
          webSite: normalizeText(row.webSite ?? row.WebSite) || undefined,
          clasificacion:
            normalizeText(row.clasificacion ?? row.Clasificacion) || undefined,
          categoria: normalizeText(row.categoria ?? row.Categoria) || undefined,
          fechaAniversario:
            normalizeText(row.fechaAniversario ?? row.FechaAniversario) ||
            undefined,
          representanteLegal:
            normalizeText(
              row.representanteLegal ?? row.RepresentanteLegal,
            ) || undefined,
          fechaNacimiento:
            normalizeText(row.fechaNacimiento ?? row.FechaNacimiento) ||
            undefined,
          nota: normalizeText(row.nota ?? row.Nota) || undefined,
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
      const isLegacyFormat = parts.length <= 5;
      const ruc = isLegacyFormat ? "" : normalizeText(parts[1]);
      const razonSocial = isLegacyFormat ? "" : normalizeText(parts[2]);
      const canalNombre = isLegacyFormat
        ? normalizeText(parts[1])
        : normalizeText(parts[3]);

      if (!canalNombre) return null;

      const direccion = isLegacyFormat ? "" : normalizeText(parts[4]);
      const region = isLegacyFormat ? "" : normalizeText(parts[5]);
      const telefono = isLegacyFormat
        ? normalizeText(parts[3])
        : normalizeText(parts[6]);
      const celular = isLegacyFormat ? "" : normalizeText(parts[7]);
      const email = isLegacyFormat
        ? normalizeText(parts[4])
        : normalizeText(parts[8]);
      const webSite = isLegacyFormat ? "" : normalizeText(parts[9]);
      const clasificacion = isLegacyFormat ? "" : normalizeText(parts[10]);
      const categoria = isLegacyFormat ? "" : normalizeText(parts[11]);
      const fechaAniversario = isLegacyFormat ? "" : normalizeText(parts[12]);
      const representanteLegal = isLegacyFormat ? "" : normalizeText(parts[13]);
      const fechaNacimiento = isLegacyFormat ? "" : normalizeText(parts[14]);
      const contacto = isLegacyFormat
        ? normalizeText(parts[2])
        : normalizeText(parts[15]);
      const contacto02 = isLegacyFormat ? "" : normalizeText(parts[16]);
      const nota = isLegacyFormat ? "" : normalizeText(parts[17]);

      return {
        id: idCanal > 0 ? idCanal : index + 1,
        idCanal,
        idAuxiliar: idCanal || undefined,
        ruc: ruc || undefined,
        razonSocial: razonSocial || undefined,
        canalNombre,
        direccion: direccion || undefined,
        region: region || undefined,
        contacto: contacto || undefined,
        contacto02: contacto02 || undefined,
        telefono: telefono || undefined,
        celular: celular || undefined,
        email: email || undefined,
        webSite: webSite || undefined,
        clasificacion: clasificacion || undefined,
        categoria: categoria || undefined,
        fechaAniversario: fechaAniversario || undefined,
        representanteLegal: representanteLegal || undefined,
        fechaNacimiento: fechaNacimiento || undefined,
        nota: nota || undefined,
      } as SalesChannelDetail;
    })
    .filter((item): item is SalesChannelDetail => Boolean(item));
};

const parseSavedCanalId = (rawResponse: string, fallbackId = 0): number => {
  const trimmed = String(rawResponse ?? "").trim();
  const normalized = trimmed.toLowerCase();
  if (normalized === "true" || normalized === "ok") {
    return Number.isFinite(fallbackId) ? Math.max(0, fallbackId) : 0;
  }
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
    return parseSavedCanalId(responseText, Number(payload.idAuxiliar || 0));
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
