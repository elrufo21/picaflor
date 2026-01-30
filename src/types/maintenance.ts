export interface Category {
  id?: string | number;
  idSubLinea?: number;
  nombreSublinea: string;
  codigoSunat: string;
  nombre?: string | null;
}

export interface Area {
  id: number;
  area: string;
}

export interface Hotel {
  id: number;
  hotel: string;
  region: string;
  horaIngreso: string;
  horaSalida: string;
  direccion: string;
}

export interface DeparturePoint {
  id: number;
  destination: string;
  pointName: string;
  horaPartida: string;
  region: string;
  productId: number;
}

export interface Product {
  id: number;
  categoria: string;
  codigo: string;
  descripcion: string;
  precio: number;
  ventaSoles: number;
  ventaDolar: number;
  preCosto: number;
  vencimiento: string;
  aplicaFV: string;
  estado: string;
  usuario: string;
  registro: number;
  stock: number;
  cantidad: number;
  cantMaxPax: number;
  cantFIS: number | null;
  imagen: string;
  cantANT: number;
  fechaEdicion: string;
  inversion: number | null;
  ventaNeta: number;
  margenUtilidad: number;
  valorCritico: number | null;
  aplicaTC: string;
  costoDolar: number | null;
  tipoCambio: number | null;
  aplicaINV: string | null;
  unidadM: string | null;
  visitasExCur: string | null;
  region: string | null;
  unidad: string | null;
  valorUM: number;
}

export interface ActividadAdi {
  id: number;
  destino: string;
  actividad: string;
  precioSol: number;
  entradaSol: number;
  precioDol: number;
  entradaDol: number;
  region?: string | null;
  idProducto?: number | null;
}

export interface Computer {
  id: number;
  maquina: string;
  registro: string;
  serieFactura: string;
  serieNc: string;
  serieBoleta: string;
  ticketera: string;
  areaId: number;
}

export interface ProviderBankAccount {
  cuentaId?: number;
  proveedorId?: number;
  entidad: string;
  tipoCuenta: string;
  moneda: string;
  nroCuenta: string;
  action?: "i" | "u" | "d";
}

export interface Provider {
  id: number;
  razon: string;
  ruc: string;
  contacto: string;
  celular: string;
  telefono: string;
  correo: string;
  direccion: string;
  estado: string;
  imagen?: string | null;
  images?: string[];
  cuentasBancarias?: ProviderBankAccount[];
}

export interface Holiday {
  id: number;
  fecha: string;
  motivo: string;
}

export interface BankEntity {
  id: number;
  nombre: string;
}

export interface Client {
  id?: number;
  clienteId: number;
  clienteRazon?: string;
  clienteRuc?: string;
  clienteDni?: string;
  clienteDireccion?: string;
  clienteMovil?: string;
  clienteTelefono?: string;
  clienteCorreo?: string;
  clienteEstado?: string;
  clienteDespacho?: string;
  clienteUsuario?: string;
  clienteFecha?: string;
  companiaId?: number | null;
}
