import { useState, useEffect } from "react";
import { usePackageStore } from "../store/fulldayStore";
import { hasServiciosData, serviciosDB } from "@/app/db/serviciosDB";
import type {
  PrecioActividad,
  PrecioAlmuerzo,
  PrecioTraslado,
} from "@/app/db/serviciosDB";

export const usePackageData = (id: string | undefined, setValue: any) => {
  const [partidas, setPartidas] = useState<
    { value: string; label: string }[] | undefined
  >();
  const [hoteles, setHoteles] = useState<
    { value: string; label: string }[] | undefined
  >();
  const [actividades, setActividades] = useState<
    { value: string; label: string }[] | undefined
  >();
  const [almuerzos, setAlmuerzos] = useState<
    { value: string; label: string }[] | undefined
  >();
  const [trasladosOptions, setTrasladosOptions] = useState<
    { value: string; label: string }[] | undefined
  >();
  const [horasPartida, setHorasPartida] = useState<
    { idParti: string; hora: string }[] | undefined
  >();
  
  const [preciosActividades, setPreciosActividades] = useState<PrecioActividad[] | undefined>();
  const [preciosAlmuerzo, setPreciosAlmuerzo] = useState<PrecioAlmuerzo[] | undefined>();
  const [preciosTraslado, setPreciosTraslado] = useState<PrecioTraslado[] | undefined>();

  const pkg = usePackageStore((s) => s.getPackageById(Number(id)));
  const { loadServiciosFromDB, loadServicios } = usePackageStore();

  useEffect(() => {
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
          dataActividades,
          dataPrecios,
          dataPreciosActividades,
          dataAlmuerzos,
          dataPreciosAlmuerzo,
          dataTraslados,
          dataPreciosTraslado,
          dataHorasPartida,
        ] = await Promise.all([
          serviciosDB.partidas.toArray(),
          serviciosDB.hoteles.toArray(),
          serviciosDB.actividades.toArray(),
          serviciosDB.preciosProducto.toArray(),
          serviciosDB.preciosActividades.toArray(),
          serviciosDB.almuerzos.toArray(),
          serviciosDB.preciosAlmuerzo.toArray(),
          serviciosDB.traslados.toArray(),
          serviciosDB.preciosTraslado.toArray(),
          serviciosDB.horasPartida.toArray(),
        ]);

        if (cancelled) return;

        // 3️⃣ PARTIDAS (por producto)
        setPartidas(
           dataPartidas
            .filter((p) => Number(p.idProducto) === Number(id))
            .map((d) => ({
              value: String(d.id),
              label: d.partida,
            }))
        );

        // 4️⃣ HOTELES (por región)
        const regionPkg = pkg?.region?.toUpperCase();
        setHoteles(
          regionPkg
            ? dataHoteles
                .filter((h) => String(h.region).toUpperCase() === regionPkg)
                .map((h) => ({
                  value: String(h.id),
                  label: h.nombre,
                }))
            : []
        );

        // 5️⃣ ACTIVIDADES (por producto)
        setActividades(
          dataActividades
            .filter((a) => Number(a.idProducto) === Number(id))
            .map((a) => ({
              value: String(a.id),
              label: a.actividad,
            }))
        );

        setAlmuerzos(
          dataAlmuerzos.map((a) => ({
            value: String(a.id),
            label: a.nombre,
          }))
        );

        setTrasladosOptions(
          dataTraslados.map((t) => ({
            value: String(t.id),
            label: t.nombre,
          }))
        );

        setHorasPartida(
          dataHorasPartida.map((h) => ({
            idParti: String(h.idParti),
            hora: String(h.hora ?? "").trim(),
          }))
        );

        // 6️⃣ VISITAS
        const precio = dataPrecios.find(
          (p) => Number(p.idProducto) === Number(id)
        );

        setPreciosActividades(dataPreciosActividades as PrecioActividad[]);
        setPreciosAlmuerzo(dataPreciosAlmuerzo as PrecioAlmuerzo[]);
        setPreciosTraslado(dataPreciosTraslado as PrecioTraslado[]);

        if (precio?.visitas) {
          setValue("visitas", precio.visitas, {
            shouldDirty: false,
            shouldTouch: false,
          });
        }
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        console.error("Error cargando datos del producto:", err);
      }
    };

    if (id && pkg?.region) {
      init();
    }

    return () => {
      cancelled = true;
    };
  }, [id, pkg?.region, loadServicios, loadServiciosFromDB, setValue]);

  return {
    pkg,
    partidas,
    hoteles,
    actividades,
    almuerzos,
    trasladosOptions,
    horasPartida,
    preciosActividades,
    preciosAlmuerzo,
    preciosTraslado,
  };
};
