export type Personal = {
  personalId: number;
  personalNombres: string;
  personalApellidos: string;
  areaId: number | null;
  personalCodigo?: string;
  personalNacimiento?: string | null;
  personalIngreso?: string | null;
  personalDni?: string;
  personalDireccion?: string;
  personalTelefono?: string;
  personalTelefonoAsi?: string;
  personalEmail?: string;
  personalEstado?: "ACTIVO" | "INACTIVO" | string;
  personalImagen?: string | null;
  companiaId?: number | null;
  personalBajaFecha?: string | null;
  personalRuc?: string | null;
  personalLicencia?: string | null;
  personalSueldo?: number | null;
  gerencia?: string | null;
};

export type Employee = Personal;
