import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createProgramacion,
  deleteProgramacion,
  fetchPackages,
  editarCantMax,
  fetchListadoByProducto,
} from "../api/cityTourApi";
import { getServiciosFromDB } from "@/app/db/serviciosDB";
import {
  refreshServiciosData,
  type ServiciosData,
} from "@/app/db/serviciosSync";
import { getTodayDateInputValue } from "@/shared/helpers/formatDate";

const pendingLoadPackagesRef = {
  date: "",
  promise: null as Promise<void> | null,
};

const pendingListadoPromises = new Map<string, Promise<void>>();

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
  idProducto?: number;
  destino: string;
  fecha: string; // YYYY-MM-DD
  cantTotalPax: number;
  cantMaxPax: number;
  disponibles: number;
  estado: string;
  transporte?: string;
  guia?: string;
  verListadoUrl?: string;
  passengers: Passenger[];
};

type PackageState = {
  packages: PackageItem[];
  formData: any;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  setFormData: (formData: any) => void;
  listado: any;
  selectedFullDayName: string;
  servicios: ServiciosData | null;
  loading: boolean;
  listadoLoading: boolean;
  error: string | null;

  // 🔥 backend
  loadPackages: (fecha?: string) => Promise<void>;
  loadListadoByProducto: (
    fecha: string | undefined,
    idProducto: number,
  ) => Promise<void>;
  setSelectedFullDayName: (name: string) => void;
  loadServicios: () => Promise<void>;
  loadServiciosFromDB: () => Promise<void>;
  // 🔥 lógica local (NO TOCAR)
  addPassenger: (
    packageId: number,
    passenger: Omit<Passenger, "id" | "packageId">,
  ) => void;
  createProgramacion: (data: {
    idProducto: number;
    destino: string;
    fecha: string;
    cantMax: number;
    region: string;
  }) => Promise<void>;
  getPackageById: (id: number) => PackageItem | undefined;
  clearPackages: () => void;
  deleteProgramacion: (id: number, fecha?: string) => Promise<void>;
  editarCantMax: (
    data: {
      idDetalle: number;
      cantMax: number;
      transporte?: string;
      guia?: string;
    }[],
    date: string,
  ) => Promise<void>;
  date: string;
  setDate: (date: string) => void;
};

const sanitizeListaOrdenText = (value: unknown) =>
  String(value ?? "")
    .replace(/[|;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function parsePackages(raw: unknown) {
  if (!raw) return [];

  if (Array.isArray(raw)) return raw;

  if (typeof raw !== "string") return [];

  return raw
    .split("¬")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((row) => {
      const [
        id,
        destino,
        fecha,
        cantTotalPax,
        cantMaxPax,
        disponibles,
        estado,
        region,
        accionTexto,
        idDetalle,
        transporte,
        guia,
      ] = row.split("|");

      return {
        id: Number(id),
        idProducto: Number(id),
        destino,
        fecha,
        cantTotalPax: Number(cantTotalPax),
        cantMaxPax: Number(cantMaxPax),
        disponibles: Number(disponibles),
        estado,
        region,
        accionTexto,
        idDetalle: Number(idDetalle),
        transporte: transporte ?? "",
        guia: guia ?? "",
        passengers: [],
      };
    });
}

export const usePackageStore = create<PackageState>()(
  persist(
    (set, get) => ({
      formData: null,
      setFormData: (formData) => set({ formData }),
      isEditing: false,
      setIsEditing: (isEditing) => set({ isEditing }),
      packages: [],
      listado: [],
      selectedFullDayName: "",
      loading: false,
      listadoLoading: false,
      date: getTodayDateInputValue(),
      setDate: (date) => set({ date }),
      setSelectedFullDayName: (name) =>
        set({ selectedFullDayName: (name ?? "").trim() }),
      error: null,
      servicios: null,

      /* =========================
     CARGAR DESDE BACKEND
  ========================= */

      loadPackages: async (fecha) => {
        const targetDate =
          fecha?.slice(0, 10) ?? get().date ?? getTodayDateInputValue();
        if (!targetDate) {
          return;
        }
        if (
          pendingLoadPackagesRef.date === targetDate &&
          pendingLoadPackagesRef.promise
        ) {
          return pendingLoadPackagesRef.promise;
        }

        pendingLoadPackagesRef.date = targetDate;
        const promise = (async () => {
          try {
            set({ loading: true, error: null });

            const raw = await fetchPackages(targetDate);

            const parsed = parsePackages(raw);

            set({
              packages: parsed,
              loading: false,
            });
          } catch (err: any) {
            set({
              loading: false,
              error: err?.message ?? "Error al cargar packages",
            });
          } finally {
            pendingLoadPackagesRef.promise = null;
          }
        })();

        pendingLoadPackagesRef.promise = promise;
        return promise;
      },
      loadListadoByProducto: async (fecha, idProducto) => {
        if (!idProducto) {
          set({ listado: [] });
          return;
        }

        const targetFecha = fecha ?? get().date ?? getTodayDateInputValue();
        const key = `${targetFecha}#${idProducto}`;
        if (pendingListadoPromises.has(key)) {
          return pendingListadoPromises.get(key);
        }

        const promise = (async () => {
          try {
            set({ listadoLoading: true, error: null });
            const response = await fetchListadoByProducto(targetFecha, idProducto);
            set({
              listado: response ?? [],
              listadoLoading: false,
            });
          } catch (err: any) {
            set({
              listadoLoading: false,
              error: err?.message ?? "Error al cargar listado",
            });
          } finally {
            pendingListadoPromises.delete(key);
          }
        })();

        pendingListadoPromises.set(key, promise);
        return promise;
      },
      loadServiciosFromDB: async () => {
        const data = await getServiciosFromDB();
        set({ servicios: data });
      },
      loadServicios: async () => {
        try {
          set({ loading: true, error: null });
          const data = await refreshServiciosData();
          set({ servicios: data, loading: false });
        } catch (err: any) {
          console.error(err);
          set({
            loading: false,
            error: err?.message ?? "Error al cargar servicios",
          });
        }
      },
      clearPackages: () => {
        set({ packages: [] });
      },
      createProgramacion: async (data) => {
        try {
          set({ loading: true, error: null });

          const payload = {
            idDetalle: 0,
            idProducto: data.idProducto,
            destino: data.destino,
            // Enviar sólo YYYY-MM-DD (aaaa-mm-dd) para que el backend reciba formato consistente
            fecha: data.fecha.slice(0, 10),
            cantMax: data.cantMax,
            region: data.region,
          };

          const rs = await createProgramacion(payload);

          // 🔥 refresca tabla automáticamente
          await get().loadPackages(data.fecha.slice(0, 10));

          set({ loading: false });
          return rs;
        } catch (err: any) {
          set({
            loading: false,
            error: err?.message ?? "Error al crear programación",
          });
          throw err;
        }
      },

      /* =========================
     NO TOCAR – TU LÓGICA
  ========================= */

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

      getPackageById: (id) => {
        return get().packages.find((pkg) => pkg.id === id);
      },
      deleteProgramacion: async (id, fecha) => {
        try {
          set({ loading: true, error: null });

          await deleteProgramacion(id);

          // 🔥 refresca la tabla
          if (fecha) {
            await get().loadPackages(fecha.slice(0, 10));
          } else {
            // fallback: quitar del estado local (coincida por id o idDetalle)
            set((state) => ({
              packages: state.packages.filter(
                (p) => p.id !== id && (p as any).idDetalle !== id,
              ),
            }));
          }

          set({ loading: false });
        } catch (err: any) {
          set({
            loading: false,
            error: err?.message ?? "Error al eliminar programación",
          });
          throw err;
        }
      },
      editarCantMax: async (changes, date) => {
        try {
          set({ loading: true, error: null });

          if (!changes.length) {
            set({ loading: false });
            return;
          }

          // 🔥 transformar array → "5|30|Transporte|Guia;8|45|Transporte|Guia"
          const listaOrden = changes
            .map((x) =>
              [
                x.idDetalle,
                x.cantMax,
                sanitizeListaOrdenText(x.transporte),
                sanitizeListaOrdenText(x.guia),
              ].join("|"),
            )
            .join(";");

          // 👉 llamada API
          await editarCantMax(listaOrden);

          // 🔄 refrescar tabla CON FECHA CORRECTA
          await get().loadPackages(date?.slice(0, 10));

          set({ loading: false });
        } catch (err: any) {
          set({
            loading: false,
            error: err?.message ?? "Error al editar cantidad máxima",
          });
          throw err;
        }
      },
    }),
    {
      name: "picaflor.fullday",
      partialize: (state) => ({
        selectedFullDayName: state.selectedFullDayName,
        date: state.date,
      }),
    },
  ),
);
