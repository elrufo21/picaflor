import { API_BASE_URL } from "@/config";
import type { Hotel } from "@/types/maintenance";

const HOTEL_SAMPLE_CSV = [
  "IdHotel|Region|Hotel|HoraIN|HoraSal|Direccion",
  "100|100|100|100|100|500",
  "String|String|String|String|String|String",
  "1|Lima|Hotel Costa Dorada|07:00|22:00|Av. Principal 123",
  "2|Cusco|Hotel Los Pinos|12:00|23:30|Jr. Pinos 456",
  "3|Arequipa|Hotel Mirador del Colca|14:00|21:00|Calle Colca 789",
].join("¬");

const FIELD_ALIASES: Record<keyof Hotel, string[]> = {
  id: ["id", "idhotel", "hotelid"],
  hotel: ["hotel", "nombre"],
  region: ["region", "departamento"],
  horaIngreso: ["horain", "horaingreso", "horallegada"],
  horaSalida: ["horasal", "horasalida", "horapartida"],
  direccion: ["direccion", "domicilio"],
};

const normalizeColumnName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const getFieldByColumn = (column: string): keyof Hotel | null => {
  const normalized = normalizeColumnName(column);
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((alias) => alias === normalized)) {
      return field as keyof Hotel;
    }
  }
  return null;
};

export const parseHotelCsv = (payload?: string | null): Hotel[] => {
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

  const columnIndex: Partial<Record<keyof Hotel, number>> = {};
  header.forEach((column, index) => {
    const field = getFieldByColumn(column);
    if (field) {
      columnIndex[field] = index;
    }
  });

  const dataRows = rows.slice(3);
  const parsed: Hotel[] = [];

  dataRows.forEach((row) => {
    const values = row.split("|").map((cell) => cell.trim());
    const getValue = (field: keyof Hotel) =>
      columnIndex[field] !== undefined ? values[columnIndex[field] ?? 0] ?? "" : "";

    const idValue =
      columnIndex.id !== undefined ? Number(values[columnIndex.id] ?? "") : NaN;
    if (Number.isNaN(idValue)) return;

    parsed.push({
      id: idValue,
      hotel: getValue("hotel"),
      region: getValue("region"),
      horaIngreso: getValue("horaIngreso"),
      horaSalida: getValue("horaSalida"),
      direccion: getValue("direccion"),
    });
  });

  return parsed;
};

export const hotelsQueryKey = ["hotels"] as const;

export const fetchHotelsApi = async (): Promise<Hotel[]> => {
  const HOTEL_LIST_ENDPOINT = `${API_BASE_URL}/Hotel/list`;

const mapHotelResponse = (item: any): Hotel => ({
  id: Number(item?.idHotel ?? item?.id ?? 0) || 0,
  hotel: String(item?.hotel ?? ""),
  horaIngreso: String(item?.horaIngreso ?? ""),
  horaSalida: String(item?.horaSalida ?? ""),
  region: String(item?.region ?? ""),
  direccion: String(item?.direccion ?? ""),
});

const isValidHotelRow = (item: any) => {
  if (!item) return false;
  const id = Number(item?.idHotel ?? item?.id ?? -1);
  const name = String(item?.hotel ?? "").trim().toLowerCase();
  if (!Number.isFinite(id) || id <= 0) return false;
  if (!name || name === "string") return false;
  return true;
};

  try {
    const response = await fetch(HOTEL_LIST_ENDPOINT, {
      headers: {
        accept: "text/plain",
      },
    });
    if (!response.ok) {
      throw new Error(`Hotel list request failed: ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Hotel list response is not an array");
    }
    return payload.filter(isValidHotelRow).map(mapHotelResponse);
  } catch (error) {
    console.error("Error fetching hotels", error);
    return parseHotelCsv(HOTEL_SAMPLE_CSV);
  }
};
