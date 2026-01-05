import { create } from "zustand";

export type Passenger = {
  id: number;
  packageId: number;
  nombreCompleto: string;
  documentoTipo: string;
  documentoNumero: string;
  celular?: string;
  email?: string;
  telefono?: string;
  cantPax: number;
  fechaViaje: string; // ISO
  fechaPago?: string;
  fechaEmision?: string;
  moneda?: string;
  origen?: string;
  canalVenta?: string;
  counter?: string;
  condicion?: string;
  puntoPartida?: string;
  otrosPartidas?: string;
  hotel?: string;
  horaPresentacion?: string;
  visitas?: string;
  tarifaTour?: string;
  actividades?: string[];
  traslados?: string;
  entradas?: string;
  precioUnit?: number;
  cantidad?: number;
  subTotal?: number;
  precioBase?: number;
  impuesto?: number;
  cargosExtras?: number;
  acuenta?: number;
  cobroExtraSol?: number;
  cobroExtraDol?: number;
  deposito?: number;
  total?: number;
  medioPago?: string;
  entidadBancaria?: string;
  nroOperacion?: string;
  notas?: string;
};

export type PackageItem = {
  id: number;
  destino: string;
  fecha: string; // ISO date string
  cantTotalPax: number;
  cantMaxPax: number;
  disponibles: number;
  estado: string;
  verListadoUrl?: string;
  passengers: Passenger[];
};

type PackageState = {
  packages: PackageItem[];
  addPackage: (item: Omit<PackageItem, "id" | "passengers">) => void;
  addPassenger: (packageId: number, passenger: Omit<Passenger, "id" | "packageId">) => void;
  getPackageById: (id: number) => PackageItem | undefined;
};

const initialPackages: PackageItem[] = [
  {
    id: 1,
    destino: "FULL DAY PARACAS - ICA",
    fecha: "2026-02-01",
    cantTotalPax: 0,
    cantMaxPax: 0,
    disponibles: 0,
    estado: "BLOQUEADO",
    verListadoUrl: "#",
    passengers: [],
  },
  {
    id: 2,
    destino: "FULL DAY ANTIOQUIA",
    fecha: "2026-02-01",
    cantTotalPax: 0,
    cantMaxPax: 0,
    disponibles: 0,
    estado: "BLOQUEADO",
    verListadoUrl: "#",
    passengers: [],
  },
];

export const usePackageStore = create<PackageState>((set, get) => ({
  packages: initialPackages,
  addPackage: (item) => {
    const nextId =
      get().packages.reduce((max, pkg) => Math.max(max, pkg.id), 0) + 1;
    set((state) => ({
      packages: [...state.packages, { ...item, id: nextId, passengers: [] }],
    }));
  },
  addPassenger: (packageId, passenger) => {
    set((state) => {
      const nextPassengerId =
        state.packages
          .flatMap((p) => p.passengers)
          .reduce((max, p) => Math.max(max, p.id), 0) + 1;

      const packages = state.packages.map((pkg) => {
        if (pkg.id !== packageId) return pkg;
        const cantPax = passenger.cantPax ?? 0;
        const newCantTotal = (pkg.cantTotalPax ?? 0) + cantPax;
        const newDisponibles =
          pkg.cantMaxPax > 0
            ? Math.max(pkg.cantMaxPax - newCantTotal, 0)
            : pkg.disponibles;

        return {
          ...pkg,
          cantTotalPax: newCantTotal,
          disponibles: newDisponibles,
          passengers: [
            ...pkg.passengers,
            {
              ...passenger,
              id: nextPassengerId,
              packageId,
            },
          ],
        };
      });

      return { packages };
    });
  },
  getPackageById: (id) => get().packages.find((pkg) => pkg.id === id),
}));
