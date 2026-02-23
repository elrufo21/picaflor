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

export type ItineraryEventRow = {
  id: number;
  tipo: string;
  hora: string;
  descripcion: string;
  movimiento: string;
};

export type ItineraryDayRow = {
  id: number;
  fecha: string;
  titulo: string;
  origen: string;
  destino: string;
  // Hotel fields per day
  hotel: string;
  tipoHabitacion: string;
  alimentacion: string;
  eventos: ItineraryEventRow[];
};

export type HotelRoomSelection = {
  tipo: string;
  cantidad: number;
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

export type TravelPackageFormState = {
  fechaEmision: string;
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
  movilidadTipo: string;
  movilidadEmpresa: string;
  incluyeHotel: boolean;
  hotelesContratados: HotelServicioRow[];
  pasajeros: PassengerRow[];
  itinerario: ItineraryDayRow[];
  idioma: string;
  incluye: string;
  noIncluye: string;
  impuestosAdicionales: string;
  observaciones: string;
  cantPax:string;
};
