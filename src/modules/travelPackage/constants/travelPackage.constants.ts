import type {
  ItineraryDayRow,
  ItineraryEventRow,
  PassengerRow,
  SelectOption,
  TravelPackageFormState,
} from "../types/travelPackage.types";

// ─── Select options ──────────────────────────────────────────────────────────

export const DESTINO_OPTIONS = [
  "Lima",
  "Cusco",
  "Arequipa",
  "Paracas",
  "Ica",
  "Puno",
  "Tarapoto",
  "Trujillo",
];

export const AGENCIA_OPTIONS: SelectOption[] = [
  { label: "Canal Web", value: "CANAL_WEB" },
  { label: "Agencia Miraflores Travel", value: "MIRAFLORES_TRAVEL" },
  { label: "Operador Andes", value: "OPERADOR_ANDES" },
  { label: "Counter Interno", value: "COUNTER_INTERNO" },
];

export const MOVILIDAD_OPTIONS = ["BUS", "AEREO", "CRUCERO"];

export const HABITACION_OPTIONS = [
  "Simple",
  "Doble",
  "Matrimonial",
  "Triple",
  "Familiar",
];

export const ALIMENTACION_OPTIONS = [
  "Desayuno",
  "Media pension",
  "Pension completa",
];

export const EVENTO_OPTIONS = [
  "Traslado",
  "Actividad / Tour",
  "Hotel",
  "Vuelo",
  "Dia libre",
  "Nota libre",
];

export const MOVIMIENTO_OPTIONS = ["No aplica", "Salida", "Llegada"];

export const IDIOMA_OPTIONS = ["Espanol", "Ingles", "Portugues", "Frances"];

export const PRODUCT_OPTIONS = [
  "City Tour Arequipa",
  "Valle Sagrado",
  "Machu Picchu",
  "Laguna Humantay",
  "Montaña 7 Colores",
  "Ruta del Sol",
  "City Tour Cusco",
  "City Tour Lima",
  "Paracas + Huacachina",
  "Lago Titicaca full day",
  "Cañon del Colca 2d/1n",
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export const getTodayIso = (): string => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

export const getSessionDisplayName = (): string => {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem("picaflor.auth.session");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return String(parsed?.user?.displayName ?? "").trim();
  } catch {
    return "";
  }
};

// ─── Row factories ────────────────────────────────────────────────────────────

export const createPassengerRow = (id: number): PassengerRow => ({
  id,
  nombres: "",
  documento: "",
  nacionalidad: "",
  fechaNacimiento: "",
});

export const createEventRow = (id: number): ItineraryEventRow => ({
  id,
  tipo: "",
  hora: "",
  descripcion: "",
  movimiento: "No aplica",
});

export const createItineraryDayRow = (
  dayId: number,
  eventId: number,
): ItineraryDayRow => ({
  id: dayId,
  fecha: "",
  titulo: "",
  origen: "",
  destino: "",
  hotel: "",
  tipoHabitacion: "",
  alimentacion: "",
  eventos: [createEventRow(eventId)],
});

// ─── Helper aliases for Hook ──────────────────────────────────────────────────

export const createEmptyPassenger = () => createPassengerRow(Date.now() + Math.random());
export const createEmptyEvent = () => createEventRow(Date.now() + Math.random());
export const createEmptyItineraryDay = () => 
  createItineraryDayRow(Date.now() + Math.random(), Date.now() + Math.random() + 1);

// ─── Initial State ────────────────────────────────────────────────────────────

export const INITIAL_FORM_STATE: TravelPackageFormState = {
  fechaEmision: getTodayIso(),
  destinos: [],
  programa: "",
  fechaInicioViaje: "",
  fechaFinViaje: "",
  agencia: null,
  counter: getSessionDisplayName(),
  contacto: "",
  telefono: "",
  email: "",
  movilidadTipo: "",
  movilidadEmpresa: "",
  pasajeros: [createEmptyPassenger()],
  itinerario: [],
  idioma: "Espanol",
  incluye: "",
  noIncluye: "",
  impuestosAdicionales: "",
  observaciones: "",
};
