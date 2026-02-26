export type SelectOption = {
  label: string;
  value: string;
};

export type PassengerRow = {
  id: number;
  nombres: string;
  pasaporte: string;
  nacionalidad: string;
  telefono: string;
  fechaNacimiento: string;
};

export type ItineraryActivityRow = {
  id: number;
  tipo: "ACT1" | "ACT2" | "ACT3" | "TRASLADO" | "ENTRADA";
  detalle: string;
  precio: number;
  cant: number;
  subtotal: number;
};

export type ItineraryDayRow = {
  id: number;
  fecha: string;
  titulo: string;
  precioUnitario: number;
  observacion: string;
  origen: string;
  destino: string;
  actividades: ItineraryActivityRow[];
};

export type HotelRoomSelection = {
  tipo: string;
  cantidad: number;
  precio: number;
};

export type HotelServicioRow = {
  id: number;
  region: string;
  hotel: string;
  habitaciones: HotelRoomSelection[];
  entrada: string;
  salida: string;
  incluyeAlimentacion: boolean;
};

export type TravelPackageSelectionRow = {
  id: number;
  paquete: string;
  cantPax: number;
  cantidad: number;
};

export type TravelPackageFormState = {
  fechaEmision: string;
  paquetesViaje: TravelPackageSelectionRow[];
  destinos: string[];
  programa: string;
  fechaInicioViaje: string;
  fechaFinViaje: string;
  agencia: SelectOption | null;
  counter: string;
  contacto: string;
  telefono: string;
  email: string;
  condicionPago: string;
  moneda: "SOLES" | "DOLARES";
  documentoCobranza: string;
  nserie: string;
  ndocumento: string;
  medioPago: string;
  entidadBancaria: string;
  nroOperacion: string;
  precioExtraSoles: number;
  precioExtraDolares: number;
  igv: number;
  cargosExtra: number;
  totalGeneral: number;
  acuenta: number;
  deposito: number;
  efectivo: number;
  saldo: number;
  mensajePasajero: string;
  movilidadTipo: string;
  movilidadEmpresa: string;
  movilidadPrecio: number;
  incluyeHotel: boolean;
  hotelesContratados: HotelServicioRow[];
  pasajeros: PassengerRow[];
  itinerario: ItineraryDayRow[];
  idioma: string;
  incluye: string;
  noIncluye: string;
  impuestosAdicionales: string;
  observaciones: string;
  cantPax: string;
};
