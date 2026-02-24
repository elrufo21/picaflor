import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";
import { normalizeLegacyXmlPayload } from "@/shared/helpers/normalizeLegacyXmlPayload";
import { toPlainText } from "@/shared/helpers/safeText";

const PAISES_ENDPOINT = `${API_BASE_URL}/PaqueteDeViaje/paises`;

export type PaisOption = {
  id: number;
  iso: string;
  nombre: string;
};

const normalizeText = (value: unknown) =>
  toPlainText(normalizeLegacyXmlPayload(String(value ?? ""))).trim();

const parsePaisesPayload = (payload: unknown): PaisOption[] => {
  if (payload === null || payload === undefined) return [];

  let rawPayload = payload;

  if (typeof rawPayload === "string") {
    const trimmed = rawPayload.trim();
    if (!trimmed || trimmed === "~") return [];

    try {
      const parsed = JSON.parse(trimmed);
      rawPayload = parsed;
    } catch {
      rawPayload = trimmed;
    }
  }

  if (Array.isArray(rawPayload)) {
    return rawPayload
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const id = Number(row.id ?? row.Id ?? index + 1);
        const iso = normalizeText(row.iso ?? row.ISO);
        const nombre = normalizeText(row.nombre ?? row.Nombre ?? row.pais);
        if (!nombre) return null;
        return {
          id: Number.isFinite(id) ? id : index + 1,
          iso,
          nombre,
        } as PaisOption;
      })
      .filter((item): item is PaisOption => Boolean(item));
  }

  if (typeof rawPayload === "string") {
    return rawPayload
      .split("¬")
      .map((row) => row.trim())
      .filter((row) => row && row !== "~")
      .map((row, index) => {
        const [idRaw, isoRaw, nombreRaw] = row.split("|");
        const idCandidate = Number(normalizeText(idRaw));
        const iso = normalizeText(isoRaw);
        const nombre = normalizeText(nombreRaw);
        if (!nombre) return null;
        return {
          id: Number.isFinite(idCandidate) ? idCandidate : index + 1,
          iso,
          nombre,
        } as PaisOption;
      })
      .filter((item): item is PaisOption => Boolean(item));
  }

  return [];
};

export const usePaises = () => {
  const [paises, setPaises] = useState<PaisOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPaises = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(PAISES_ENDPOINT, {
          method: "GET",
          headers: {
            accept: "text/plain, application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const rawText = await response.text();
        const parsed = parsePaisesPayload(rawText);
        if (active) {
          setPaises(parsed);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "No se pudo cargar países",
          );
          setPaises([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadPaises();

    return () => {
      active = false;
    };
  }, []);

  return { paises, loading, error };
};

