import { useState, useEffect } from "react";
import { usePackageStore } from "../store/cityTourStore";
import { hasServiciosData, serviciosDB } from "@/app/db/serviciosDB";
import { normalizeLegacyXmlPayload } from "@/shared/helpers/normalizeLegacyXmlPayload";
import type {
  PrecioActividad,
  PrecioAlmuerzo,
  PrecioTraslado,
  DireccionHotel,
} from "@/app/db/serviciosDB";

type Option = { value: string; label: string };
type SetValueFn = (
  name: string,
  value: unknown,
  options?: { shouldDirty?: boolean; shouldTouch?: boolean },
) => void;
type ProductoCityTourDetalle = {
  id: number;
  nombre: string;
  idProducto: number;
  precioBase: number;
  precioVenta: number;
  visitas: string;
};

export const usePackageData = (id: string | undefined, setValue: SetValueFn) => {
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

  const [precioProducto, setPrecioProducto] =
    useState<ProductoCityTourDetalle | null>(null);
  const [productosCityTourDetalle, setProductosCityTourDetalle] = useState<
    ProductoCityTourDetalle[]
  >([]);

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
          dataProductosCityTour,
          dataPreciosProducto,
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
          serviciosDB.productosCityTourOrdena.toArray(),
          serviciosDB.preciosProducto.toArray(),
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
              value: String(a.id),
              label: normalizeLegacyXmlPayload(String(a.actividad ?? "")),
              id: String(a.id),
              descripcion: normalizeLegacyXmlPayload(
                String(a.descripcion ?? ""),
              ),
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

        // PRODUCTOS CITY TOUR + PRECIO PRODUCTO (solo ids coincidentes)
        const preciosByProductId = new Map(
          dataPreciosProducto.map((precio) => [
            Number(precio.idProducto),
            precio,
          ]),
        );
        const detalle = dataProductosCityTour
          .map((producto) => {
            const precio = preciosByProductId.get(Number(producto.id));
            if (!precio) return null;

            return {
              id: Number(producto.id),
              nombre: normalizeLegacyXmlPayload(String(producto.nombre ?? "")),
              idProducto: Number(precio.idProducto),
              precioBase: Number(precio.precioBase || 0),
              precioVenta: Number(precio.precioVenta || 0),
              visitas: normalizeLegacyXmlPayload(String(precio.visitas ?? "")),
            };
          })
          .filter(
            (item): item is ProductoCityTourDetalle => item !== null,
          );
        setProductosCityTourDetalle(detalle);

        // DETALLE DEL PRODUCTO ACTUAL
        const precioProductoFromDB =
          detalle.find((item) => Number(item.id) === Number(id)) ?? null;
        setPrecioProducto(precioProductoFromDB);

        if (precioProductoFromDB?.precioVenta != null) {
          setValue("precioVenta", Number(precioProductoFromDB.precioVenta), {
            shouldDirty: false,
            shouldTouch: false,
          });
        }

        if (precioProductoFromDB?.visitas) {
          setValue(
            "visitas",
            normalizeLegacyXmlPayload(String(precioProductoFromDB.visitas)),
            {
              shouldDirty: false,
              shouldTouch: false,
            },
          );
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
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
    precioProducto,
    productosCityTourDetalle,
  };
};
