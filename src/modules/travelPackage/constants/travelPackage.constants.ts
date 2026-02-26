import type {
  HotelServicioRow,
  ItineraryDayRow,
  ItineraryActivityRow,
  PassengerRow,
  SelectOption,
  TravelPackageSelectionRow,
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
export const TRAVEL_PACKAGE_SELECTOR_OPTIONS: TravelPackageSelectionRow[] = [
  { id: 1, paquete: "Paquete matrimonial", cantPax: 2, cantidad: 1 },
  { id: 2, paquete: "Paquete simple", cantPax: 1, cantidad: 1 },
  { id: 3, paquete: "Paquete sin hotel", cantPax: 1, cantidad: 1 },
  { id: 4, paquete: "Paquete doble", cantPax: 2, cantidad: 1 },
  { id: 5, paquete: "Paquete triple", cantPax: 3, cantidad: 1 },
  { id: 6, paquete: "Paquete cuadruple", cantPax: 4, cantidad: 1 },
  { id: 7, paquete: "Paquete quintuple", cantPax: 5, cantidad: 1 },
  { id: 8, paquete: "Paquete familiar", cantPax: 4, cantidad: 1 },
  { id: 9, paquete: "Paquete suite", cantPax: 2, cantidad: 1 },
  { id: 10, paquete: "Paquete junior suite", cantPax: 2, cantidad: 1 },
];
export const HOTEL_INCLUSION_OPTIONS = [
  { value: "SI", label: "Incluye hotel" },
  { value: "NO", label: "No incluye hotel" },
];
export const ALIMENTACION_BOOL_OPTIONS = [
  { value: "SI", label: "Incluye" },
  { value: "NO", label: "No incluye" },
];

export const CONDICION_PAGO_OPTIONS = [
  { value: "CANCELADO", label: "Cancelado" },
  { value: "ACUENTA", label: "A Cuenta" },
  { value: "CREDITO", label: "Credito" },
];

export const HABITACION_OPTIONS = [
  "Simple",
  "Doble",
  "Matrimonial",
  "Triple",
  "Cuadruple",
  "Quintuple",
  "Familiar",
  "Suite",
  "Junior Suite",
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

export const getTravelCurrencySymbol = (
  moneda: TravelPackageFormState["moneda"],
) => (moneda === "DOLARES" ? "USD$" : "S/");

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
  pasaporte: "",
  nacionalidad: "",
  telefono: "",
  fechaNacimiento: "",
});

export const createActivityRow = (id: number): ItineraryActivityRow => ({
  id,
  tipo: "ACT1",
  detalle: "-",
  precio: 0,
  cant: 0,
  subtotal: 0,
});

export const createActivityRowByType = (
  id: number,
  tipo: ItineraryActivityRow["tipo"],
): ItineraryActivityRow => ({
  id,
  tipo,
  detalle: tipo === "ENTRADA" ? "N/A" : "-",
  precio: 0,
  cant: 0,
  subtotal: 0,
});

export const createDefaultItineraryRows = (): ItineraryActivityRow[] => {
  const baseId = Date.now() + Math.random();
  return [
    createActivityRowByType(baseId + 1, "ACT1"),
    createActivityRowByType(baseId + 2, "ACT2"),
    createActivityRowByType(baseId + 3, "ACT3"),
    createActivityRowByType(baseId + 4, "TRASLADO"),
    createActivityRowByType(baseId + 5, "ENTRADA"),
  ];
};

export const createItineraryDayRow = (
  dayId: number,
  activityId: number,
): ItineraryDayRow => ({
  id: dayId,
  fecha: "",
  titulo: "",
  precioUnitario: 0,
  observacion: "",
  origen: "",
  destino: "",
  actividades:
    activityId > 0
      ? [
          createActivityRowByType(activityId + 1, "ACT1"),
          createActivityRowByType(activityId + 2, "ACT2"),
          createActivityRowByType(activityId + 3, "ACT3"),
          createActivityRowByType(activityId + 4, "TRASLADO"),
          createActivityRowByType(activityId + 5, "ENTRADA"),
        ]
      : createDefaultItineraryRows(),
});

export const createHotelServicioRow = (id: number): HotelServicioRow => ({
  id,
  region: "",
  hotel: "",
  habitaciones: [],
  entrada: "",
  salida: "",
  incluyeAlimentacion: false,
});

// ─── Helper aliases for Hook ──────────────────────────────────────────────────

export const createEmptyPassenger = () => createPassengerRow(Date.now() + Math.random());
export const createEmptyActivity = () => createActivityRow(Date.now() + Math.random());
export const createEmptyItineraryDay = () => 
  createItineraryDayRow(Date.now() + Math.random(), Date.now() + Math.random() + 1);
export const createEmptyHotelServicio = () =>
  createHotelServicioRow(Date.now() + Math.random());

// ─── Initial State ────────────────────────────────────────────────────────────

export const INITIAL_FORM_STATE: TravelPackageFormState = {
  fechaEmision: getTodayIso(),
  paquetesViaje: [],
  destinos: [],
  programa: "",
  fechaInicioViaje: "",
  fechaFinViaje: "",
  agencia: null,
  counter: getSessionDisplayName(),
  contacto: "",
  telefono: "",
  email: "",
  condicionPago: "CANCELADO",
  moneda: "DOLARES",
  documentoCobranza: "DOCUMENTO COBRANZA",
  nserie: "",
  ndocumento: "",
  medioPago: "",
  entidadBancaria: "",
  nroOperacion: "",
  precioExtraSoles: 0,
  precioExtraDolares: 0,
  igv: 0,
  cargosExtra: 0,
  totalGeneral: 0,
  acuenta: 0,
  deposito: 0,
  efectivo: 0,
  saldo: 0,
  mensajePasajero: "",
  movilidadTipo: "",
  movilidadEmpresa: "",
  movilidadPrecio: 0,
  incluyeHotel: false,
  hotelesContratados: [],
  pasajeros: [createEmptyPassenger()],
  itinerario: [],
  idioma: "Espanol",
  incluye: "",
  noIncluye: "",
  impuestosAdicionales: "",
  observaciones: "",
  cantPax: "",
};
