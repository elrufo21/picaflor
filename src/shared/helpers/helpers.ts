function parseLegacyData(raw) {
  if (!raw || typeof raw !== "string") return [];

  return raw
    .split("[") // bloques
    .map(
      (block) =>
        block
          .split("¬") // registros
          .filter((r) => r.trim() !== "")
          .map((row) => row.split("|")) // campos
    );
}

export function transformServiciosData(raw) {
  const blocks = parseLegacyData(raw);

  return {
    servicios:
      blocks[0]?.map(([id, nombre]) => ({
        id: Number(id),
        nombre,
      })) || [],

    detalles:
      blocks[1]?.map(([idProducto, entrada, descripcion, precio]) => ({
        idProducto: Number(idProducto),
        entrada: Number(entrada),
        descripcion,
        precio: Number(precio),
      })) || [],

    canales:
      blocks[2]?.map(([id, nombre]) => ({
        id: Number(id),
        nombre,
      })) || [],

    actividades:
      blocks[3]?.map(([id, actividad, idProducto]) => ({
        id: Number(id),
        actividad,
        idProducto: Number(idProducto),
      })) || [],
  };
}
