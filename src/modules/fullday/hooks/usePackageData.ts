import { useState, useEffect } from "react";
import { usePackageStore } from "../store/fulldayStore";
import { hasServiciosData, serviciosDB } from "@/app/db/serviciosDB";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/store/auth/auth.store";
import type {
  PrecioActividad,
  PrecioAlmuerzo,
  PrecioTraslado,
  DireccionHotel,
} from "@/app/db/serviciosDB";

type Option = {
  value: string;
  label: string;
  id?: string;
  estado?: string | null;
};

const parseRawPayload = (rawText: string): unknown => {
  const trimmed = String(rawText ?? "").trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

const normalizeNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseAuxiliarProductPrice = (
  payload: unknown,
): { precioDolares: number; precioSoles: number } | null => {
  if (!payload) return null;
  if (Array.isArray(payload)) {
    return parseAuxiliarProductPrice(payload[0]);
  }
  if (typeof payload !== "object") return null;

  const row = payload as Record<string, unknown>;
  return {
    precioDolares: normalizeNumber(
      row.precioDolares ??
        row.PrecioDolares ??
        row.precioDol ??
        row.PrecioDol ??
        row.ventaDolar ??
        row.VentaDolar,
    ),
    precioSoles: normalizeNumber(
      row.precioSoles ??
        row.PrecioSoles ??
        row.precioSol ??
        row.PrecioSol ??
        row.ventaSoles ??
        row.VentaSoles,
    ),
  };
};

export const usePackageData = (
  id: string | undefined,
  setValue: any,
  currency?: string,
) => {
  /* =========================
     STATE
  ========================= */
  const [partidas, setPartidas] = useState<Option[]>();
  const [hoteles, setHoteles] = useState<Option[]>();
  const [actividades, setActividades] = useState<Option[]>();
  const [almuerzos, setAlmuerzos] = useState<Option[]>();
  const [trasladosOptions, setTrasladosOptions] = useState<Option[]>();
  const [horasPartida, setHorasPartida] =
    useState<{ idParti: string; hora: string }[]>();
  const [direccionesHotel, setDireccionesHotel] = useState<DireccionHotel[]>();

  const [preciosActividades, setPreciosActividades] =
    useState<PrecioActividad[]>();
  const [preciosAlmuerzo, setPreciosAlmuerzo] = useState<PrecioAlmuerzo[]>();
  const [preciosTraslado, setPreciosTraslado] = useState<PrecioTraslado[]>();

  const [precioProducto, setPrecioProducto] = useState<any>();
  const authUser = useAuthStore((state) => state.user);
  const isExternalUser =
    String(authUser?.tipoUsuario ?? "")
      .trim()
      .toUpperCase() === "EXTERNO" ||
    authUser?.isExternal === true ||
    Number(authUser?.canalVentaId ?? 0) > 0;
  const canalVentaId = Number(authUser?.canalVentaId ?? 0);

  /* =========================
     STORE
  ========================= */
  const pkg = usePackageStore((s) => s.getPackageById(Number(id)));
  const { loadServiciosFromDB, loadServicios } = usePackageStore();

  /* =========================
     EFFECT
  ========================= */
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const init = async () => {
      try {
        const exists = await hasServiciosData();
        if (exists) {
          await loadServiciosFromDB();
        } else {
          await loadServicios();
        }

        const [
          dataPartidas,
          dataHoteles,
          dataDireccionesHotel,
          dataActividades,
          precioProductoFromDB,
          dataPreciosActividades,
          dataAlmuerzos,
          dataPreciosAlmuerzo,
          dataTraslados,
          dataPreciosTraslado,
          dataHorasPartida,
        ] = await Promise.all([
          serviciosDB.partidas.toArray(),
          serviciosDB.hoteles.toArray(),
          serviciosDB.direccionesHotel.toArray(),
          serviciosDB.actividades.toArray(),
          serviciosDB.preciosProducto.get(Number(id)),
          serviciosDB.preciosActividades.toArray(),
          serviciosDB.almuerzos.toArray(),
          serviciosDB.preciosAlmuerzo.toArray(),
          serviciosDB.traslados.toArray(),
          serviciosDB.preciosTraslado.toArray(),
          serviciosDB.horasPartida.toArray(),
        ]);

        if (cancelled) return;

        /* =========================
           MAP DATA
        ========================= */

        // PARTIDAS
        const partidasByProduct = dataPartidas.filter(
          (p) => Number(p.idProducto) === Number(id),
        );
        const partidasSource =
          partidasByProduct.length > 0 ? partidasByProduct : dataPartidas;
        setPartidas(
          partidasSource.map((p) => ({
            value: p.partida,
            label: p.partida,
            id: p.id,
          })),
        );

        // HOTELES
        setHoteles(
          dataHoteles.map((h) => ({
            value: String(h.id),
            label: h.nombre,
          })),
        );

        setDireccionesHotel(dataDireccionesHotel);

        // ACTIVIDADES
        const actividadesByProduct = dataActividades.filter(
          (a) => Number(a.idProducto) === Number(id),
        );
        const actividadesSource =
          actividadesByProduct.length > 0
            ? actividadesByProduct
            : dataActividades;
        setActividades(
          actividadesSource.map((a) => ({
            value: a.actividad,
            label: a.actividad,
            id: String(a.id),
            estado: a.estado ?? "",
          })),
        );

        // ALMUERZOS
        setAlmuerzos(
          dataAlmuerzos.map((a) => ({
            value: a.nombre,
            label: a.nombre,
            id: String(a.id),
          })),
        );

        // TRASLADOS
        setTrasladosOptions(
          dataTraslados.map((t) => ({
            value: t.nombre,
            label: t.nombre,
            id: String(t.id),
          })),
        );

        // HORAS PARTIDA
        setHorasPartida(
          dataHorasPartida.map((h) => ({
            idParti: String(h.idParti),
            hora: String(h.hora ?? "").trim(),
          })),
        );

        // PRECIOS
        setPreciosActividades(dataPreciosActividades);
        setPreciosAlmuerzo(dataPreciosAlmuerzo);
        setPreciosTraslado(dataPreciosTraslado);

        let resolvedPrecioProducto = precioProductoFromDB;

        // Si el usuario es externo y tiene canal de venta, intentamos usar
        // la tarifa del auxiliar para este producto.
        if (
          isExternalUser &&
          canalVentaId > 0 &&
          Number(id) > 0 &&
          precioProductoFromDB
        ) {
          try {
            const priceResponse = await fetch(
              `${API_BASE_URL}/Productos/${Number(id)}/auxiliar/${canalVentaId}/precio`,
              {
                method: "GET",
                headers: { accept: "application/json, text/plain" },
              },
            );

            if (priceResponse.ok) {
              const rawPriceText = await priceResponse.text();
              const parsedPrice = parseRawPayload(rawPriceText);
              const auxiliarPrice = parseAuxiliarProductPrice(parsedPrice);

              if (auxiliarPrice) {
                resolvedPrecioProducto = {
                  ...precioProductoFromDB,
                  precioDol: auxiliarPrice.precioDolares,
                  precioVenta: auxiliarPrice.precioSoles,
                  precioBase:
                    auxiliarPrice.precioSoles ||
                    precioProductoFromDB?.precioBase ||
                    0,
                };
              }
            }
          } catch (error) {
            console.error("No se pudo resolver precio por canal de venta", error);
          }
        }

        // PRECIO PRODUCTO
        setPrecioProducto(resolvedPrecioProducto);

        if (resolvedPrecioProducto?.visitas) {
          setValue("visitas", resolvedPrecioProducto.visitas, {
            shouldDirty: false,
            shouldTouch: false,
          });
        }
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        console.error("Error cargando datos del producto:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [
    canalVentaId,
    id,
    isExternalUser,
    pkg?.region,
    loadServicios,
    loadServiciosFromDB,
    setValue,
  ]);

  useEffect(() => {
    if (!precioProducto) return;
    const isUsd =
      String(currency ?? "")
        .trim()
        .toUpperCase() === "USD";
    const nextPrice = isUsd
      ? Number(
          precioProducto?.precioDol ??
            precioProducto?.precioVenta ??
            precioProducto?.precioBase ??
            0,
        )
      : Number(precioProducto?.precioVenta ?? precioProducto?.precioBase ?? 0);

    setValue("precioVenta", nextPrice, {
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [precioProducto, currency, setValue]);

  /* =========================
     RETURN
  ========================= */
  return {
    pkg,
    partidas,
    hoteles,
    direccionesHotel,
    actividades,
    almuerzos,
    trasladosOptions,
    horasPartida,
    preciosActividades,
    preciosAlmuerzo,
    preciosTraslado,
    precioProducto, // ✅ AQUÍ ESTÁ
  };
};
