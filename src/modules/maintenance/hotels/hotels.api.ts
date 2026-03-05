import { API_BASE_URL } from "@/config";
import type { Hotel } from "@/types/maintenance";

const HOTEL_SAMPLE_CSV = [
  "IdHotel|Region|Hotel|HoraIngreso|HoraSalida|Direccion|Telefono|Celular|Email|Clasificacion|Categoria|TiposHabitaciones|Contacto01|Contacto02|Nota",
  "100|80|250|40|40|500|50|50|150|100|100|300|150|150|500",
  "Int|String|String|String|String|String|String|String|String|String|String|String|String|String|String",
  "1|Lima|Hotel Costa Dorada|07:00AM|10:00PM|Av. Principal 123|012345678|999111222|costa@example.com|4*|Premium|Simple,Doble|Carlos Rojas|Ana Rios|Recepcion 24 horas",
  "2|Cusco|Hotel Los Pinos|12:00PM|11:30PM|Jr. Pinos 456|014444444|988777666|pinos@example.com|3*|Standard|Simple,Matrimonial|Luis Quispe|Mariela Choque|Incluye desayuno",
].join("¬");

const FIELD_ALIASES: Record<keyof Hotel, string[]> = {
  id: ["id", "idhotel", "hotelid"],
  hotel: ["hotel", "nombre"],
  region: ["region", "departamento"],
  horaIngreso: ["horain", "horaingreso", "horallegada", "horaentrada"],
  horaSalida: ["horasal", "horasalida", "horapartida", "horacheckout"],
  direccion: ["direccion", "domicilio"],
  telefono: ["telefono", "telefonofijo", "tel"],
  celular: ["celular", "movil", "mobile"],
  email: ["email", "correo", "correoelectronico"],
  clasificacion: ["clasificacion", "clasif"],
  categoria: ["categoria"],
  tiposHabitaciones: ["tiposhabitaciones", "tipohabitaciones", "habitaciones"],
  contacto01: ["contacto01", "contacto1", "contactoprincipal"],
  contacto02: ["contacto02", "contacto2", "contactosecundario"],
  nota: ["nota", "observacion", "observaciones"],
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
      telefono: getValue("telefono"),
      celular: getValue("celular"),
      email: getValue("email"),
      clasificacion: getValue("clasificacion"),
      categoria: getValue("categoria"),
      tiposHabitaciones: getValue("tiposHabitaciones"),
      contacto01: getValue("contacto01"),
      contacto02: getValue("contacto02"),
      nota: getValue("nota"),
    });
  });

  return parsed;
};

export const hotelsQueryKey = ["hotels"] as const;

export const fetchHotelsApi = async (): Promise<Hotel[]> => {
  const HOTEL_LIST_ENDPOINT = `${API_BASE_URL}/Hotel/list`;

  const normalizeText = (value: unknown) => {
    const parsed = String(value ?? "").trim();
    if (!parsed) return "";
    return parsed.toLowerCase() === "null" ? "" : parsed;
  };

  const mapHotelResponse = (item: Record<string, unknown>): Hotel => ({
    id: Number(item.idHotel ?? item.id ?? 0) || 0,
    hotel: normalizeText(item.hotel),
    horaIngreso: normalizeText(item.horaIngreso),
    horaSalida: normalizeText(item.horaSalida),
    region: normalizeText(item.region),
    direccion: normalizeText(item.direccion),
    telefono: normalizeText(item.telefono),
    celular: normalizeText(item.celular),
    email: normalizeText(item.email),
    clasificacion: normalizeText(item.clasificacion),
    categoria: normalizeText(item.categoria),
    tiposHabitaciones: normalizeText(item.tiposHabitaciones),
    contacto01: normalizeText(item.contacto01),
    contacto02: normalizeText(item.contacto02),
    nota: normalizeText(item.nota),
  });

  const isValidHotelRow = (item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const row = item as Record<string, unknown>;
    const id = Number(row.idHotel ?? row.id ?? -1);
    const name = String(row.hotel ?? "").trim().toLowerCase();
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
