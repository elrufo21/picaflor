import type { Table } from "dexie";

export async function fullSyncTable<
  T extends { [K in KID]: any },
  KID extends keyof T,
>(table: Table<T, T[KID]>, data: T[], idKey: KID) {
  if (!Array.isArray(data)) return;

  const incomingIds = new Set(data.map((item) => item[idKey]));

  const existing = await table.toArray();

  const idsToDelete = existing
    .filter((item) => !incomingIds.has(item[idKey]))
    .map((item) => item[idKey]);

  if (idsToDelete.length) {
    await table.bulkDelete(idsToDelete as any[]);
  }

  if (data.length) {
    await table.bulkPut(data);
  }
}

function parseLegacyData(raw: string): string[][][] {
  if (!raw) return [];

  return raw.split("[").map((block) =>
    block
      .split(/(?:Â)?¬/)
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => row.split("|")),
  );
}

export function transformServiciosData(raw: string) {
  const b = parseLegacyData(raw);

  return {
    productos:
      b[0]
        ?.map(([id, nombre]) => ({
          id: Number(id),
          nombre,
        }))
        .filter((x) => Number.isFinite(x.id)) ?? [],

    preciosProducto:
      b[1]
        ?.map(([idProducto, precioBase, visitas, precioVenta]) => ({
          idProducto: Number(idProducto),
          precioBase: Number(precioBase),
          visitas,
          precioVenta: Number(precioVenta),
        }))
        .filter((x) => Number.isFinite(x.idProducto)) ?? [],

    canales:
      b[2]
        ?.map(([id, nombre]) => ({
          id: Number(id),
          nombre,
        }))
        .filter((x) => Number.isFinite(x.id)) ?? [],

    actividades:
      b[3]
        ?.map(([id, actividad, descripcion, idProducto]) => ({
          id: Number(id),
          actividad,
          descripcion: descripcion ?? "",
          idProducto: Number(idProducto),
        }))
        .filter((x) => Number.isFinite(x.id)) ?? [],

    partidas:
      b[4]
        ?.map(([id, partida, idProducto]) => ({
          id: Number(id),
          partida,
          idProducto: Number(idProducto),
        }))
        .filter((x) => Number.isFinite(x.id)) ?? [],

    auxiliares:
      b[5]
        ?.map(([id, telefono]) => ({
          id: Number(id),
          telefono,
        }))
        .filter((x) => Number.isFinite(x.id)) ?? [],

    preciosActividades:
      b[6]
        ?.map(([idActi, precioSol, entradaSol, precioDol, entradaDol]) => ({
          idActi: Number(idActi),
          precioSol: Number(precioSol),
          entradaSol: Number(entradaSol),
          precioDol: Number(precioDol),
          entradaDol: Number(entradaDol),
        }))
        .filter((x) => Number.isFinite(x.idActi)) ?? [],

    horasPartida:
      b[7]
        ?.map(([idParti, hora]) => ({
          idParti: Number(idParti),
          hora,
        }))
        .filter((x) => Number.isFinite(x.idParti)) ?? [],

    almuerzos:
      b[8]
        ?.map(([id, nombre]) => ({
          id: Number(id),
          nombre,
        }))
        .filter((x) => Number.isFinite(x.id)) ?? [],

    traslados:
      b[9]
        ?.map(([id, nombre]) => ({
          id: Number(id),
          nombre,
        }))
        .filter((x) => Number.isFinite(x.id)) ?? [],

    preciosAlmuerzo:
      b[10]
        ?.map(([id, precioSol, precioDol]) => ({
          id: Number(id),
          precioSol: Number(precioSol),
          precioDol: Number(precioDol),
        }))
        .filter((x) => Number.isFinite(x.id)) ?? [],

    preciosTraslado:
      b[11]
        ?.map(([id, precioSol, precioDol]) => ({
          id: Number(id),
          precioSol: Number(precioSol),
          precioDol: Number(precioDol),
        }))
        .filter((x) => Number.isFinite(x.id)) ?? [],

    hoteles:
      b[12]
        ?.map(([id, nombre, region]) => ({
          id: Number(id),
          nombre,
          region,
        }))
        .filter((x) => Number.isFinite(x.id)) ?? [],

    direccionesHotel:
      b[13]
        ?.map(([idHotel, direccion]) => ({
          idHotel: Number(idHotel),
          direccion,
        }))
        .filter((x) => Number.isFinite(x.idHotel)) ?? [],

    ubigeos:
      b[14]
        ?.map(([id, nombre]) => ({
          id,
          nombre,
        }))
        .filter((x) => typeof x.id === "string" && x.id.trim() !== "") ?? [],

    // ⭐ EL CULPABLE — AHORA DOMADO
    productosCityTourOrdena:
      b[15]
        ?.map(([id, nombre]) => ({
          id: Number(id),
          nombre,
        }))
        .filter((x) => Number.isFinite(x.id) && x.nombre !== undefined) ?? [],
  };
}

export function isInvalidKey(value: any) {
  return (
    value === undefined || value === null || value === "" || Number.isNaN(value)
  );
}

export function assertValidArray<T>(table: string, key: keyof T, data: T[]) {
  data.forEach((item, index) => {
    const value = item[key];
    if (isInvalidKey(value)) {
      console.error("💥 DATA ERROR DETECTED");
      console.error("📦 Table:", table);
      console.error("🔑 Key:", key);
      console.error("📍 Index:", index);
      console.error("📄 Item:", item);
      throw new Error(`Invalid key in ${table}`);
    }
  });
}

// shared/helpers/helpers.ts
export function moveFocus(current: HTMLElement, direction: "next" | "prev") {
  const container = current.closest("[data-grid-form]");
  if (!container) return;

  // 👇 SOLO inputs de precio
  const focusables = Array.from(
    container.querySelectorAll<HTMLElement>(
      "input[data-precio]:not([disabled])",
    ),
  );

  const index = focusables.indexOf(current);
  if (index === -1) return;

  const nextIndex = direction === "next" ? index + 1 : index - 1;
  focusables[nextIndex]?.focus();
}

export function toISODate(value?: string | Date | null): string {
  if (!value) return "";

  // Si ya es Date
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    // dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [dd, mm, yyyy] = value.split("/");
      return `${yyyy}-${mm}-${dd}`;
    }

    // yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
  }

  return "";
}

const ISO_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}:\d{2}:\d{2}))?$/;
const DMY_DATE_PATTERN =
  /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?$/;
export function formatFechaParaMostrar(value?: string): string {
  if (!value) return "";
  const trimmed = value.trim();

  const isoMatch = trimmed.match(ISO_DATE_PATTERN);
  if (isoMatch) {
    const [, year, month, day, time] = isoMatch;
    return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
  }

  const dmyMatch = trimmed.match(DMY_DATE_PATTERN);
  if (dmyMatch) {
    const [, day, month, year, time] = dmyMatch;
    return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
  }

  return trimmed;
}
