export type SelectOption = {
  label: string;
  value: string;
};

export type PassengerRow = {
  id: number;
  nombres: string;
  documento: string;
  nacionalidad: string;
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
  movilidadTipo: string;
  movilidadEmpresa: string;
  pasajeros: PassengerRow[];
  itinerario: ItineraryDayRow[];
  idioma: string;
  incluye: string;
  noIncluye: string;
  impuestosAdicionales: string;
  observaciones: string;
};
