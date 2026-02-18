import { useState } from "react";
import { API_BASE_URL } from "@/config";
import { parseCanalPayload, type CanalOption } from "./canalUtils";
import { useOnceEffect } from "@/shared/hooks/useOnceEffect";

const CANAL_LIST_ENDPOINT = `${API_BASE_URL}/Programacion/traerCanalVentaDetalle`;
const CANAL_SAVE_ENDPOINT = `${API_BASE_URL}/Canal/guardar-auxiliar`;

type SaveCanalVentaPayload = {
  idAuxiliar: number;
  auxiliar: string;
  telefono: string;
  contacto: string;
  email: string;
};

const parseSavedCanalId = (rawResponse: string): number => {
  const trimmed = String(rawResponse ?? "").trim();

  const directNumber = Number(trimmed);
  if (Number.isFinite(directNumber)) return directNumber;

  try {
    const parsed = JSON.parse(trimmed);

    if (typeof parsed === "number" && Number.isFinite(parsed)) return parsed;

    if (parsed && typeof parsed === "object") {
      const blob = parsed as Record<string, unknown>;
      const idCandidate =
        blob.idAuxiliar ??
        blob.IdAuxiliar ??
        blob.idCanal ??
        blob.IdCanal ??
        blob.id ??
        blob.Id ??
        blob.canalId;
      const idNumber = Number(idCandidate);
      if (Number.isFinite(idNumber)) return idNumber;
    }
  } catch {
    // noop
  }

  throw new Error("No se pudo interpretar el ID del canal guardado.");
};

export const useCanalVenta = () => {
  const [canalVentaList, setCanalVentaList] = useState<CanalOption[]>([]);

  useOnceEffect(() => {
    const fetchCanales = async () => {
      try {
        const response = await fetch(CANAL_LIST_ENDPOINT, {
          headers: { accept: "application/json, text/plain" },
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const rawText = await response.text();

        const parsed = (() => {
          try {
            return JSON.parse(rawText);
          } catch {
            return rawText;
          }
        })();

        const mapped: CanalOption[] = parseCanalPayload(parsed);

        // ✅ SIEMPRE setear estado (aunque venga vacío)
        setCanalVentaList((prev) => {
          if (!mapped || mapped.length === 0) return prev;

          const existing = new Map(
            prev.map((opt) => [opt.value.toLowerCase(), opt]),
          );

          mapped.forEach((opt) => {
            const key = opt.value.toLowerCase();
            if (!existing.has(key)) {
              existing.set(key, opt);
            }
          });

          return Array.from(existing.values());
        });
      } catch (error) {
        console.error("No se pudo cargar canales de venta", error);
      }
    };

    fetchCanales();
  }, []);

  const addCanalToList = (newOption: CanalOption, editingValue?: string) => {
    setCanalVentaList((prev) => {
      const targetIndex = editingValue
        ? prev.findIndex(
            (opt) => opt.value.toLowerCase() === editingValue.toLowerCase(),
          )
        : -1;

      if (targetIndex >= 0) {
        const next = [...prev];
        next[targetIndex] = newOption;
        return next;
      }

      const exists = prev.some(
        (opt) =>
          opt.value.toLowerCase() === newOption.value.toLowerCase() ||
          opt.label.toLowerCase() === newOption.label.toLowerCase(),
      );

      if (exists) return prev;
      return [...prev, newOption];
    });
  };

  const saveCanalVenta = async (payload: SaveCanalVentaPayload) => {
    const response = await fetch(CANAL_SAVE_ENDPOINT, {
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
  };

  return { canalVentaList, addCanalToList, saveCanalVenta };
};
