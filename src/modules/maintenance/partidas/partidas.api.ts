import type { DeparturePoint } from "@/types/maintenance";

const PARTIDAS_SAMPLE_CSV = [
  "Id|Destino|PuntoPartida|HoraPartida|Region|IdProducto",
  "100|100|100|100|100|100",
  "String|String|String|String|String|String",
  "1|Cusco Explorer|Plaza Mayor|08:00|Cusco|2001",
  "2|Lima Express|Miraflores|09:30|Lima|2002",
  "3|Arequipa Comfort|Cayma|07:45|Arequipa|2003",
].join("¬");

const FIELD_ALIASES: Record<keyof DeparturePoint, string[]> = {
  id: ["id", "idparti", "partidaid"],
  destination: ["destino", "ruta", "producto", "productonombre"],
  pointName: ["puntopartida", "partidas", "punto", "partida"],
  horaPartida: ["horapartida", "horasalida"],
  region: ["region", "departamento"],
  productId: ["idproducto", "producto_id"],
};

const normalizeColumnName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const getFieldByColumn = (column: string): keyof DeparturePoint | null => {
  const normalized = normalizeColumnName(column);
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((alias) => alias === normalized)) {
      return field as keyof DeparturePoint;
    }
  }
  return null;
};

export const parsePartidasCsv = (payload?: string | null): DeparturePoint[] => {
  if (!payload) return [];
  const rows = payload
    .split("¬")
    .map((row) => row.trim())
    .filter((row) => row.length > 0 && row !== "~");

  if (rows.length <= 3) return [];

  const header = rows[0]
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  const columnIndex: Partial<Record<keyof DeparturePoint, number>> = {};
  header.forEach((column, index) => {
    const field = getFieldByColumn(column);
    if (field) {
      columnIndex[field] = index;
    }
  });

  const dataRows = rows.slice(3);
  const parsed: DeparturePoint[] = [];

  dataRows.forEach((row) => {
    const values = row.split("|").map((cell) => cell.trim());
    const getValue = (field: keyof DeparturePoint) =>
      columnIndex[field] !== undefined ? values[columnIndex[field] ?? 0] ?? "" : "";

    const idValue =
      columnIndex.id !== undefined ? Number(values[columnIndex.id] ?? "") : NaN;
    if (Number.isNaN(idValue)) return;

    const productIdValue =
      columnIndex.productId !== undefined
        ? Number(values[columnIndex.productId] ?? "")
        : 0;

    parsed.push({
      id: idValue,
      destination: getValue("destination"),
      pointName: getValue("pointName"),
      horaPartida: getValue("horaPartida"),
      region: getValue("region"),
      productId: Number.isNaN(productIdValue) ? 0 : productIdValue,
    });
  });

  return parsed;
};

export const partidasQueryKey = ["partidas"] as const;

export const fetchPartidasApi = async (): Promise<DeparturePoint[]> => {
  return parsePartidasCsv(PARTIDAS_SAMPLE_CSV);
};
