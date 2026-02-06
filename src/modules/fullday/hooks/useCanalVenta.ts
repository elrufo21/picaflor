import { useState } from "react";
import { API_BASE_URL } from "@/config";
import { parseCanalPayload, type CanalOption } from "./canalUtils";
import { useOnceEffect } from "@/shared/hooks/useOnceEffect";

const CANAL_LIST_ENDPOINT = `${API_BASE_URL}/Programacion/traerCanalVentaDetalle`;

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

  return { canalVentaList, addCanalToList };
};
