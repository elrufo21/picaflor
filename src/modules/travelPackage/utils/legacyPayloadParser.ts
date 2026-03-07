import { normalizeLegacyXmlPayload } from "@/shared/helpers/normalizeLegacyXmlPayload";
import { INITIAL_FORM_STATE } from "../constants/travelPackage.constants";
import type {
  HotelRoomSelection,
  HotelServicioRow,
  ItineraryActivityRow,
  ItineraryDayRow,
  PassengerRow,
  TravelPackageFormState,
  TravelPackageSelectionRow,
} from "../types/travelPackage.types";

type ParsedHotel = {
  hotelKey: number;
  orden: number;
  region: string;
  hotel: string;
  entradaSalida: string;
  incluyeAlimentacion: boolean;
  alimentacionTipo: string;
  alimentacionPrecio: number;
  importeTotal: number;
  habitaciones: Array<{
    orden: number;
    tipo: string;
    cantidad: number;
    precio: number;
  }>;
};

type ParsedDay = {
  dayKey: number;
  orden: number;
  fecha: string;
  titulo: string;
  origen: string;
  destino: string;
  observacion: string;
  precioUnitario: number;
  actividades: Array<{
    orden: number;
    tipo: ItineraryActivityRow["tipo"];
    detalle: string;
    precio: number;
    cant: number;
    subtotal: number;
  }>;
};

const normalizeCell = (value: unknown) =>
  normalizeLegacyXmlPayload(String(value ?? "")).trim();

const parseNumeric = (value: unknown, fallback = 0) => {
  const normalized = normalizeCell(value).replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parsePositiveInt = (value: unknown, fallback = 0) =>
  Math.max(0, Math.floor(parseNumeric(value, fallback)));

const parseBool = (value: unknown) => {
  const normalized = normalizeCell(value).toUpperCase();
  return normalized === "1" || normalized === "SI" || normalized === "TRUE";
};

const parseFlagVerificado = (value: unknown): "0" | "1" => {
  const normalized = normalizeCell(value).toUpperCase();
  if (["1", "SI", "TRUE", "YES", "Y"].includes(normalized)) return "1";
  return "0";
};

const isBoolToken = (value: unknown) => {
  const normalized = normalizeCell(value).toUpperCase();
  return [
    "1",
    "0",
    "SI",
    "NO",
    "TRUE",
    "FALSE",
    "YES",
    "Y",
    "N",
  ].includes(normalized);
};

const toIsoDate = (value: unknown) => {
  const text = normalizeCell(value);
  if (!text) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = text.match(ddmmyyyy);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }

  return "";
};

const getPayloadText = (raw: unknown): string => {
  if (typeof raw === "string") return normalizeCell(raw);

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const parsed = getPayloadText(item);
      if (parsed) return parsed;
    }
    return "";
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return normalizeCell(obj.Resultado ?? obj.resultado ?? obj.data ?? "");
  }

  return "";
};

const mapActivityType = (
  value: unknown,
  orden: number,
): ItineraryActivityRow["tipo"] => {
  const normalized = normalizeCell(value).toUpperCase();

  if (normalized === "TRASLADO") return "TRASLADO";
  if (normalized === "ENTRADA") return "ENTRADA";
  if (normalized === "ACT1" || normalized === "ACT2" || normalized === "ACT3") {
    return normalized;
  }

  if (normalized === "ACTIVIDAD" || normalized.startsWith("ACT")) {
    if (orden === 2) return "ACT2";
    if (orden === 3) return "ACT3";
    return "ACT1";
  }

  if (orden === 2) return "ACT2";
  if (orden === 3) return "ACT3";
  return "ACT1";
};

const createActivityBase = (
  nextId: () => number,
  tipo: ItineraryActivityRow["tipo"],
): ItineraryActivityRow => ({
  id: nextId(),
  tipo,
  detalle: tipo === "ENTRADA" ? "N/A" : "-",
  precio: 0,
  cant: 0,
  subtotal: 0,
});

export const parseTravelPackageLegacyPayload = (
  raw: unknown,
): TravelPackageFormState | null => {
  const payload = getPayloadText(raw);
  if (!payload || payload === "~" || payload === "FORMATO_INVALIDO") return null;

  const splitIndex = payload.indexOf("[");
  const headerText =
    splitIndex >= 0 ? payload.slice(0, splitIndex) : payload;
  const detailText = splitIndex >= 0 ? payload.slice(splitIndex + 1) : "";

  const header = headerText.split("|").map((item) => normalizeCell(item));
  if (!header.length || !header[0]) return null;

  let idSeed = Date.now();
  const nextId = () => {
    idSeed += 1;
    return idSeed;
  };

  const destinos: Array<{ orden: number; nombre: string }> = [];
  const paquetes: Array<{
    orden: number;
    paquete: string;
    cantPax: number;
    cantidad: number;
  }> = [];
  const pasajeros: Array<{ orden: number; row: Omit<PassengerRow, "id"> }> = [];
  const hotelesMap = new Map<number, ParsedHotel>();
  const diasMap = new Map<number, ParsedDay>();

  const detailLines = detailText
    .split(";")
    .map((item) => normalizeCell(item))
    .filter(Boolean);

  for (const line of detailLines) {
    const cols = line.split("|").map((item) => normalizeCell(item));
    const type = (cols[0] ?? "").toUpperCase();

    if (type === "DST") {
      destinos.push({
        orden: parsePositiveInt(cols[1], destinos.length + 1),
        nombre: cols[2] ?? "",
      });
      continue;
    }

    if (type === "PAQ") {
      paquetes.push({
        orden: parsePositiveInt(cols[1], paquetes.length + 1),
        paquete: cols[2] ?? "",
        cantPax: parsePositiveInt(cols[3]),
        cantidad: parsePositiveInt(cols[4]),
      });
      continue;
    }

    if (type === "PAX") {
      pasajeros.push({
        orden: parsePositiveInt(cols[1], pasajeros.length + 1),
        row: {
          nombres: cols[2] ?? "",
          pasaporte: cols[3] ?? "",
          nacionalidad: cols[4] ?? "",
          telefono: cols[5] ?? "",
          fechaNacimiento: toIsoDate(cols[6]),
        },
      });
      continue;
    }

    if (type === "HOT") {
      const hotelKey = parsePositiveInt(cols[1], hotelesMap.size + 1);
      const usesLegacyLayout = isBoolToken(cols[7]) && !isBoolToken(cols[6]);
      const legacyEntrada = normalizeCell(cols[5]);
      const legacySalida = normalizeCell(cols[6]);
      const entradaSalida = usesLegacyLayout
        ? [legacyEntrada, legacySalida].filter(Boolean).join(" / ")
        : (cols[5] ?? "");
      const incluyeAlimentacion = usesLegacyLayout
        ? parseBool(cols[7])
        : parseBool(cols[6]);
      const alimentacionTipo = usesLegacyLayout ? (cols[8] ?? "") : (cols[7] ?? "");
      const alimentacionPrecio = usesLegacyLayout
        ? parseNumeric(cols[9])
        : parseNumeric(cols[8]);
      const importeTotal = usesLegacyLayout ? 0 : parseNumeric(cols[9]);

      hotelesMap.set(hotelKey, {
        hotelKey,
        orden: parsePositiveInt(cols[2], hotelKey),
        region: cols[3] ?? "",
        hotel: cols[4] ?? "",
        entradaSalida,
        incluyeAlimentacion,
        alimentacionTipo,
        alimentacionPrecio,
        importeTotal,
        habitaciones: [],
      });
      continue;
    }

    if (type === "HAB") {
      const hotelKey = parsePositiveInt(cols[1], 0);
      if (hotelKey <= 0) continue;

      const currentHotel = hotelesMap.get(hotelKey);
      if (!currentHotel) {
        hotelesMap.set(hotelKey, {
          hotelKey,
          orden: hotelKey,
          region: "",
          hotel: "",
          entradaSalida: "",
          incluyeAlimentacion: false,
          alimentacionTipo: "",
          alimentacionPrecio: 0,
          importeTotal: 0,
          habitaciones: [],
        });
      }

      const hotel = hotelesMap.get(hotelKey);
      if (!hotel) continue;

      hotel.habitaciones.push({
        orden: parsePositiveInt(cols[2], hotel.habitaciones.length + 1),
        tipo: cols[3] ?? "",
        cantidad: parsePositiveInt(cols[4]),
        precio: parseNumeric(cols[5]),
      });
      continue;
    }

    if (type === "DAY") {
      const dayKey = parsePositiveInt(cols[1], diasMap.size + 1);
      diasMap.set(dayKey, {
        dayKey,
        orden: parsePositiveInt(cols[2], dayKey),
        fecha: toIsoDate(cols[3]),
        titulo: cols[4] ?? "",
        origen: cols[5] ?? "",
        destino: cols[6] ?? "",
        observacion: cols[7] ?? "",
        precioUnitario: parseNumeric(cols[8]),
        actividades: [],
      });
      continue;
    }

    if (type === "ACT") {
      const dayKey = parsePositiveInt(cols[1], 0);
      if (dayKey <= 0) continue;

      if (!diasMap.has(dayKey)) {
        diasMap.set(dayKey, {
          dayKey,
          orden: dayKey,
          fecha: "",
          titulo: "",
          origen: "",
          destino: "",
          observacion: "",
          precioUnitario: 0,
          actividades: [],
        });
      }

      const day = diasMap.get(dayKey);
      if (!day) continue;

      const orden = parsePositiveInt(cols[2], day.actividades.length + 1);
      day.actividades.push({
        orden,
        tipo: mapActivityType(cols[3], orden),
        detalle: cols[4] ?? "",
        precio: parseNumeric(cols[5]),
        cant: parsePositiveInt(cols[6]),
        subtotal: parseNumeric(cols[7]),
      });
    }
  }

  const destinosState = destinos
    .filter((item) => item.nombre)
    .sort((a, b) => a.orden - b.orden)
    .map((item) => item.nombre);

  const paquetesState: TravelPackageSelectionRow[] = paquetes
    .filter((item) => item.paquete)
    .sort((a, b) => a.orden - b.orden)
    .map((item) => ({
      id: nextId(),
      paquete: item.paquete,
      cantPax: item.cantPax,
      cantidad: item.cantidad,
    }));

  const pasajerosState: PassengerRow[] = pasajeros
    .sort((a, b) => a.orden - b.orden)
    .map((item) => ({
      id: nextId(),
      ...item.row,
    }));
  const telPaxHeader = normalizeCell(header[41]);
  const telPaxFallback =
    pasajerosState.find((passenger) => normalizeCell(passenger.telefono))
      ?.telefono ?? "";
  const telPaxState = telPaxHeader || telPaxFallback;

  const hotelesState: HotelServicioRow[] = Array.from(hotelesMap.values())
    .sort((a, b) => a.orden - b.orden || a.hotelKey - b.hotelKey)
    .map((hotel) => {
      const habitaciones: HotelRoomSelection[] = hotel.habitaciones
        .sort((a, b) => a.orden - b.orden)
        .map((room) => ({
          tipo: room.tipo,
          cantidad: room.cantidad,
          precio: room.precio,
        }));

      return {
        id: nextId(),
        region: hotel.region,
        hotel: hotel.hotel,
        habitaciones,
        entradaSalida: hotel.entradaSalida,
        incluyeAlimentacion: hotel.incluyeAlimentacion,
        alimentacionTipo: hotel.alimentacionTipo,
        alimentacionPrecio: hotel.alimentacionPrecio,
        importeTotal: hotel.importeTotal,
      };
    });

  const orderedRowTypes: ItineraryActivityRow["tipo"][] = [
    "ACT1",
    "ACT2",
    "ACT3",
    "TRASLADO",
    "ENTRADA",
  ];

  const itinerarioState: ItineraryDayRow[] = Array.from(diasMap.values())
    .sort((a, b) => a.orden - b.orden || a.dayKey - b.dayKey)
    .map((day) => {
      const existingRows = day.actividades
        .sort((a, b) => a.orden - b.orden)
        .map((item) => ({
          id: nextId(),
          tipo: item.tipo,
          detalle: item.detalle,
          precio: item.precio,
          cant: item.cant,
          subtotal: item.subtotal,
        }));

      const firstByType = new Map<ItineraryActivityRow["tipo"], ItineraryActivityRow>();
      for (const row of existingRows) {
        if (!firstByType.has(row.tipo)) {
          firstByType.set(row.tipo, row);
        }
      }

      const baseRows = orderedRowTypes.map(
        (tipo) => firstByType.get(tipo) ?? createActivityBase(nextId, tipo),
      );
      const baseIds = new Set(baseRows.map((row) => row.id));

      const extraRows = existingRows.filter(
        (row) =>
          !baseIds.has(row.id) &&
          (row.tipo === "ACT1" || row.tipo === "ACT2" || row.tipo === "ACT3"),
      );

      return {
        id: nextId(),
        fecha: day.fecha,
        titulo: day.titulo,
        precioUnitario: day.precioUnitario,
        observacion: day.observacion,
        origen: day.origen,
        destino: day.destino,
        actividades: [...baseRows, ...extraRows],
      };
    });

  const agenciaValue = normalizeCell(header[4]);
  const agenciaLabel = normalizeCell(header[5]);
  const agencia =
    agenciaValue || agenciaLabel
      ? {
          value: agenciaValue || agenciaLabel,
          label: agenciaLabel || agenciaValue,
        }
      : null;

  const moneda =
    normalizeCell(header[11]).toUpperCase() === "SOLES" ? "SOLES" : "DOLARES";

  const nextState: TravelPackageFormState = {
    ...INITIAL_FORM_STATE,
    fechaEmision: toIsoDate(header[0]) || INITIAL_FORM_STATE.fechaEmision,
    programa: header[1] ?? "",
    fechaInicioViaje: toIsoDate(header[2]),
    fechaFinViaje: toIsoDate(header[3]),
    agencia,
    counter: header[6] ?? "",
    contacto: header[7] ?? "",
    telefono: header[8] ?? "",
    telPax: telPaxState,
    email: header[9] ?? "",
    condicionPago: header[10] || "CANCELADO",
    moneda,
    documentoCobranza: header[12] ?? "",
    nserie: header[13] ?? "",
    ndocumento: header[14] ?? "",
    medioPago: header[15] ?? "",
    entidadBancaria: header[16] ?? "",
    nroOperacion: header[17] ?? "",
    precioExtraSoles: parseNumeric(header[18]),
    precioExtraDolares: parseNumeric(header[19]),
    igv: parseNumeric(header[20]),
    cargosExtra: parseNumeric(header[21]),
    totalGeneral: parseNumeric(header[22]),
    acuenta: parseNumeric(header[23]),
    deposito: parseNumeric(header[24]),
    efectivo: parseNumeric(header[25]),
    saldo: parseNumeric(header[26]),
    mensajePasajero: header[27] ?? "",
    movilidadTipo: header[28] ?? "",
    movilidadEmpresa: header[29] ?? "",
    movilidadPrecio: parseNumeric(header[30]),
    incluyeHotel: parseBool(header[31]),
    cantPax: String(parsePositiveInt(header[32])),
    idioma: header[33] ?? "",
    incluye: header[34] ?? "",
    noIncluye: header[35] ?? "",
    impuestosAdicionales: header[36] ?? "",
    observaciones: header[37] ?? "",
    flagVerificado: parseFlagVerificado(header[39]),
    destinos: destinosState,
    paquetesViaje: paquetesState,
    pasajeros: pasajerosState,
    hotelesContratados: hotelesState,
    itinerario: itinerarioState,
  };

  return nextState;
};
