import { useState, useEffect } from "react";
import { usePackageStore } from "../store/fulldayStore";
import { hasServiciosData, serviciosDB } from "@/app/db/serviciosDB";
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

        // PRECIO PRODUCTO
        setPrecioProducto(precioProductoFromDB);

        if (precioProductoFromDB?.visitas) {
          setValue("visitas", precioProductoFromDB.visitas, {
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
  }, [id, pkg?.region, loadServicios, loadServiciosFromDB, setValue]);

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
