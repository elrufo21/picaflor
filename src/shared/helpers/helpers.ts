function parseLegacyData(raw: string): string[][][] {
  if (!raw) return [];

  return raw.split("[").map((block) =>
    block
      .split("¬")
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => row.split("|")),
  );
}

export function transformServiciosData(raw: string) {
  const b = parseLegacyData(raw);

  return {
    productos:
      b[0]?.map(([id, nombre]) => ({
        id: Number(id),
        nombre,
      })) ?? [],

    preciosProducto:
      b[1]?.map(([idProducto, precioBase, visitas, precioVenta]) => ({
        idProducto: Number(idProducto),
        precioBase: Number(precioBase),
        visitas,
        precioVenta: Number(precioVenta),
      })) ?? [],

    canales:
      b[2]?.map(([id, nombre]) => ({
        id: Number(id),
        nombre,
      })) ?? [],

    actividades:
      b[3]?.map(([id, actividad, idProducto]) => ({
        id: Number(id),
        actividad,
        idProducto: Number(idProducto),
      })) ?? [],

    partidas:
      b[4]?.map(([id, partida, idProducto]) => ({
        id: Number(id),
        partida,
        idProducto: Number(idProducto),
      })) ?? [],

    auxiliares:
      b[5]?.map(([id, telefono]) => ({
        id: Number(id),
        telefono,
      })) ?? [],

    preciosActividades:
      b[6]?.map(([idActi, precioSol, entradaSol, precioDol, entradaDol]) => ({
        idActi: Number(idActi),
        precioSol: Number(precioSol),
        entradaSol: Number(entradaSol),
        precioDol: Number(precioDol),
        entradaDol: Number(entradaDol),
      })) ?? [],

    horasPartida:
      b[7]?.map(([idParti, hora]) => ({
        idParti: Number(idParti),
        hora,
      })) ?? [],

    almuerzos:
      b[8]?.map(([id, nombre]) => ({
        id: Number(id),
        nombre,
      })) ?? [],

    traslados:
      b[9]?.map(([id, nombre]) => ({
        id: Number(id),
        nombre,
      })) ?? [],

    preciosAlmuerzo:
      b[10]?.map(([id, precioSol, precioDol]) => ({
        id: Number(id),
        precioSol: Number(precioSol),
        precioDol: Number(precioDol),
      })) ?? [],

    preciosTraslado:
      b[11]?.map(([id, precioSol, precioDol]) => ({
        id: Number(id),
        precioSol: Number(precioSol),
        precioDol: Number(precioDol),
      })) ?? [],

    hoteles:
      b[12]?.map(([id, nombre, region]) => ({
        id: Number(id),
        nombre,
        region,
      })) ?? [],

    direccionesHotel:
      b[13]?.map(([idHotel, direccion]) => ({
        idHotel: Number(idHotel),
        direccion,
      })) ?? [],

    ubigeos:
      b[14]?.map(([id, nombre]) => ({
        id,
        nombre,
      })) ?? [],
  };
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
