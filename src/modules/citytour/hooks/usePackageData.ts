import { useState, useEffect } from "react";
import { usePackageStore } from "../store/cityTourStore";
import { hasServiciosData, serviciosDB } from "@/app/db/serviciosDB";
import type {
  PrecioActividad,
  PrecioAlmuerzo,
  PrecioTraslado,
  DireccionHotel,
} from "@/app/db/serviciosDB";

type Option = { value: string; label: string };

export const usePackageData = (id: string | undefined, setValue: any) => {
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
        setPartidas(
          dataPartidas
            .filter((p) => Number(p.idProducto) === Number(id))
            .map((p) => ({
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
        setActividades(
          dataActividades
            .filter((a) => Number(a.idProducto) === Number(id))
            .map((a) => ({
              value: a.actividad,
              label: a.actividad,
              id: String(a.id),
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

        if (precioProductoFromDB?.precioVenta != null) {
          setValue("precioVenta", Number(precioProductoFromDB.precioVenta), {
            shouldDirty: false,
            shouldTouch: false,
          });
        }

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
