// src/db/serviciosDB.ts
import Dexie, { type Table } from "dexie";

export type Producto = { id: number; nombre: string; region?: string };
export type ProductoCityTourOrdena = {
  id: number;
  nombre: string;
  region?: string;
};
export type PrecioProducto = {
  idProducto: number;
  precioBase: number;
  visitas: string;
  precioVenta: number;
};
export type Canal = {
  id: number;
  nombre: string;
  contacto?: string;
  email?: string;
};
export type Actividad = {
  id: number;
  actividad: string;
  idProducto: number;
  descripcion?: string | null;
};
export type Partida = { id: number; partida: string; idProducto: number };
export type Auxiliar = {
  id: number;
  telefono: string;
  contacto?: string;
  email?: string;
};
export type PrecioActividad = {
  idActi: number;
  precioSol: number;
  entradaSol: number;
  precioDol: number;
  entradaDol: number;
};
export type HoraPartida = { idParti: number; hora: string };
export type Almuerzo = { id: number; nombre: string };
export type Traslado = { id: number; nombre: string };
export type PrecioAlmuerzo = {
  id: number;
  precioSol: number;
  precioDol: number;
};
export type PrecioTraslado = {
  id: number;
  precioSol: number;
  precioDol: number;
};
export type Hotel = { id: number; nombre: string; region: string };
export type DireccionHotel = { idHotel: number; direccion: string };
export type Ubigeo = { id: string; nombre: string };

class ServiciosDB extends Dexie {
  productos!: Table<Producto, number>;
  preciosProducto!: Table<PrecioProducto, number>;
  canales!: Table<Canal, number>;
  actividades!: Table<Actividad, number>;
  partidas!: Table<Partida, number>;
  auxiliares!: Table<Auxiliar, number>;
  preciosActividades!: Table<PrecioActividad, number>;
  horasPartida!: Table<HoraPartida, number>;
  almuerzos!: Table<Almuerzo, number>;
  traslados!: Table<Traslado, number>;
  preciosAlmuerzo!: Table<PrecioAlmuerzo, number>;
  preciosTraslado!: Table<PrecioTraslado, number>;
  hoteles!: Table<Hotel, number>;
  direccionesHotel!: Table<DireccionHotel, number>;
  ubigeos!: Table<Ubigeo, string>;
  productosCityTourOrdena!: Table<ProductoCityTourOrdena, number>;

  constructor() {
    super("servicios-db");

    this.version(1).stores({
      productos: "id",
      preciosProducto: "idProducto",
      canales: "id",
      actividades: "id",
      partidas: "id",
      auxiliares: "id",
      preciosActividades: "idActi",
      horasPartida: "idParti",
      almuerzos: "id",
      traslados: "id",
      preciosAlmuerzo: "id",
      preciosTraslado: "id",
      hoteles: "id",
      direccionesHotel: "idHotel",
      ubigeos: "id",
    });
    this.version(2).stores({
      productosCityTourOrdena: "id",
    });
  }
}
export async function hasServiciosData() {
  const counts = await Promise.all([
    serviciosDB.productos.count(),
    serviciosDB.canales.count(),
    serviciosDB.actividades.count(),
  ]);

  const hasAnyData = counts.some((count) => count > 0);
  if (!hasAnyData) return false;

  // Backward compatibility: si los productos antiguos no tienen `region`,
  // forzamos recarga desde backend para hidratar el nuevo campo.
  const sampleProducto = await serviciosDB.productos.orderBy("id").first();
  if (sampleProducto && (sampleProducto as Producto).region === undefined) {
    return false;
  }

  const sampleCityTourProducto =
    await serviciosDB.productosCityTourOrdena.orderBy("id").first();
  if (
    sampleCityTourProducto &&
    (sampleCityTourProducto as ProductoCityTourOrdena).region === undefined
  ) {
    return false;
  }

  return true;
}
export async function getServiciosFromDB() {
  return {
    productos: await serviciosDB.productos.toArray(),
    preciosProducto: await serviciosDB.preciosProducto.toArray(),
    canales: await serviciosDB.canales.toArray(),
    actividades: await serviciosDB.actividades.toArray(),
    partidas: await serviciosDB.partidas.toArray(),
    auxiliares: await serviciosDB.auxiliares.toArray(),
    preciosActividades: await serviciosDB.preciosActividades.toArray(),
    horasPartida: await serviciosDB.horasPartida.toArray(),
    almuerzos: await serviciosDB.almuerzos.toArray(),
    traslados: await serviciosDB.traslados.toArray(),
    preciosAlmuerzo: await serviciosDB.preciosAlmuerzo.toArray(),
    preciosTraslado: await serviciosDB.preciosTraslado.toArray(),
    hoteles: await serviciosDB.hoteles.toArray(),
    direccionesHotel: await serviciosDB.direccionesHotel.toArray(),
    ubigeos: await serviciosDB.ubigeos.toArray(),
    productosCityTourOrdena:
      await serviciosDB.productosCityTourOrdena.toArray(),
  };
}

export const serviciosDB = new ServiciosDB();
