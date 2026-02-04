import { API_BASE_URL } from "@/config";
import { transformServiciosData } from "@/shared/helpers/helpers";
import { serviciosDB } from "@/app/db/serviciosDB";

export type ServiciosData = {
  productos: { id: number; nombre: string }[];
  preciosProducto: {
    idProducto: number;
    precioBase: number;
    visitas: string;
    precioVenta: number;
  }[];
  canales: { id: number; nombre: string }[];
  actividades: { id: number; actividad: string; idProducto: number }[];
  partidas: { id: number; partida: string; idProducto: number }[];
  auxiliares: { id: number; telefono: string }[];
  preciosActividades: {
    idActi: number;
    precioSol: number;
    entradaSol: number;
    precioDol: number;
    entradaDol: number;
  }[];
  horasPartida: { idParti: number; hora: string }[];
  almuerzos: { id: number; nombre: string }[];
  traslados: { id: number; nombre: string }[];
  preciosAlmuerzo: { id: number; precioSol: number; precioDol: number }[];
  preciosTraslado: { id: number; precioSol: number; precioDol: number }[];
  hoteles: { id: number; nombre: string; region: string }[];
  direccionesHotel: { idHotel: number; direccion: string }[];
  ubigeos: { id: string; nombre: string }[];
  productosCityTourOrdena: { id: number; nombre: string }[];
};

const SERVICIOS_ENDPOINT = `${API_BASE_URL}/Programacion/listServ`;

async function fetchServiciosFromApi(): Promise<ServiciosData> {
  const response = await fetch(SERVICIOS_ENDPOINT, {
    headers: {
      accept: "text/plain",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Error cargando servicios (${response.status} ${response.statusText})`,
    );
  }
  const rawText = await response.text();
  return transformServiciosData(rawText);
}

async function persistServiciosData(data: ServiciosData): Promise<void> {
  await serviciosDB.transaction(
    "rw",
    [
      serviciosDB.productos,
      serviciosDB.preciosProducto,
      serviciosDB.canales,
      serviciosDB.actividades,
      serviciosDB.partidas,
      serviciosDB.auxiliares,
      serviciosDB.preciosActividades,
      serviciosDB.horasPartida,
      serviciosDB.almuerzos,
      serviciosDB.traslados,
      serviciosDB.preciosAlmuerzo,
      serviciosDB.preciosTraslado,
      serviciosDB.hoteles,
      serviciosDB.direccionesHotel,
      serviciosDB.ubigeos,
      serviciosDB.productosCityTourOrdena,
    ] as const,
    async () => {
      await serviciosDB.productos.bulkPut(data.productos);
      await serviciosDB.preciosProducto.bulkPut(data.preciosProducto);
      await serviciosDB.canales.bulkPut(data.canales);
      await serviciosDB.actividades.bulkPut(data.actividades);
      await serviciosDB.partidas.bulkPut(data.partidas);
      await serviciosDB.auxiliares.bulkPut(data.auxiliares);
      await serviciosDB.preciosActividades.bulkPut(data.preciosActividades);
      await serviciosDB.horasPartida.bulkPut(data.horasPartida);
      await serviciosDB.almuerzos.bulkPut(data.almuerzos);
      await serviciosDB.traslados.bulkPut(data.traslados);
      await serviciosDB.preciosAlmuerzo.bulkPut(data.preciosAlmuerzo);
      await serviciosDB.preciosTraslado.bulkPut(data.preciosTraslado);
      await serviciosDB.hoteles.bulkPut(data.hoteles);
      await serviciosDB.direccionesHotel.bulkPut(data.direccionesHotel);
      await serviciosDB.ubigeos.bulkPut(data.ubigeos);
      await serviciosDB.productosCityTourOrdena.bulkPut(
        data.productosCityTourOrdena,
      );
    },
  );
}

let pendingRefresh: Promise<ServiciosData> | null = null;

export function refreshServiciosData(): Promise<ServiciosData> {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = fetchServiciosFromApi()
    .then((data) => persistServiciosData(data).then(() => data))
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
}

export function queueServiciosRefresh() {
  void refreshServiciosData().catch((error) => {
    console.error("Error al refrescar servicios locales", error);
  });
}
