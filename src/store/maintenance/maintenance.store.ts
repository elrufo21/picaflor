import { create } from "zustand";
import type {
  Area,
  ActividadAdi,
  BankEntity,
  Category,
  Computer,
  DeparturePoint,
  Holiday,
  Hotel,
  Product,
  Provider,
  ProviderBankAccount,
} from "@/types/maintenance";
import { apiRequest } from "@/shared/helpers/apiRequest";
import { toast } from "sonner";
import { showToast } from "@/components/ui/AppToast";
import { queryClient } from "@/shared/queryClient";
import {
  categoriesQueryKey,
  fetchCategoriesApi,
} from "@/modules/maintenance/categories/categories.api";
import {
  areasQueryKey,
  fetchAreasApi,
} from "@/modules/maintenance/areas/areas.api";
import {
  hotelsQueryKey,
  fetchHotelsApi,
} from "@/modules/maintenance/hotels/hotels.api";
import {
  partidasQueryKey,
  fetchPartidasApi,
} from "@/modules/maintenance/partidas/partidas.api";
import {
  productsQueryKey,
  fetchProductsApi,
  deleteProductApi,
} from "@/modules/maintenance/products/products.api";
import {
  actividadesAdiQueryKey,
  fetchActividadesAdiApi,
  registerActividadAdiApi,
  updateActividadAdiApi,
  deleteActividadAdiApi,
} from "@/modules/maintenance/actividadesAdi/actividadesAdi.api";
import type { ActividadAdiRequest } from "@/modules/maintenance/actividadesAdi/actividadesAdi.api";
import {
  computersQueryKey,
  fetchComputersApi,
} from "@/modules/maintenance/computers/computers.api";
import {
  providersQueryKey,
  fetchProvidersApi,
} from "@/modules/maintenance/providers/providers.api";
import {
  holidaysQueryKey,
  fetchHolidaysApi,
  saveHolidayApi,
  deleteHolidayApi,
} from "@/modules/maintenance/holidays/holidays.api";
import { API_BASE_URL } from "@/config";
import { queueServiciosRefresh } from "@/app/db/serviciosSync";

const providerAccountHeaders = {
  Accept: "*/*",
  "Content-Type": "application/json",
};

const isDuplicateHoliday = (result: unknown) => {
  const message =
    typeof result === "string"
      ? result
      : ((result as any)?.error ??
        (result as any)?.message ??
        (result as any)?.response?.data ??
        "");

  if (typeof message !== "string") return false;
  const normalized = message.toLowerCase().trim();
  return (
    normalized === "existe feriado" ||
    normalized === "existe_feriado" ||
    normalized === "existe fecha" ||
    normalized.includes("existe feriado") ||
    normalized.includes("existe_feriado") ||
    normalized.includes("existe_fecha")
  );
};

const mapProviderAccount = (
  item: any,
  fallbackProviderId?: number,
): ProviderBankAccount => ({
  cuentaId: Number(item?.cuentaId ?? item?.id ?? 0) || undefined,
  proveedorId:
    Number(item?.proveedorId ?? fallbackProviderId ?? 0) || fallbackProviderId,
  entidad: String(item?.entidad ?? item?.entidadBancaria ?? ""),
  tipoCuenta: String(item?.tipoCuenta ?? item?.tipo ?? ""),
  moneda: String(item?.moneda ?? item?.monedaId ?? ""),
  nroCuenta: String(item?.nroCuenta ?? item?.numeroCuenta ?? ""),
});
const HOTEL_ENDPOINT = `${API_BASE_URL}/Hotel`;

const mapApiHotel = (item: any): Hotel => ({
  id: Number(item?.idHotel ?? item?.id ?? 0) || 0,
  hotel: String(item?.hotel ?? ""),
  region: String(item?.region ?? ""),
  horaIngreso: String(item?.horaIngreso ?? ""),
  horaSalida: String(item?.horaSalida ?? ""),
  direccion: String(item?.direccion ?? ""),
});

const buildHotelPayload = (data: Partial<Hotel>, overrideId?: number) => ({
  idHotel: overrideId ?? data.id ?? 0,
  hotel: data.hotel ?? "",
  region: data.region ?? "",
  horaIngreso: data.horaIngreso ?? "",
  horaSalida: data.horaSalida ?? "",
  direccion: data.direccion ?? "",
});

const resolveHotelRecord = (value: unknown, fallback: Hotel): Hotel => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const mapped = mapApiHotel(value);
    if (mapped.id) {
      return mapped;
    }
  }
  return fallback;
};
const PARTIDA_ENDPOINT = `${API_BASE_URL}/Partida`;

const mapApiPartida = (item: any): DeparturePoint => ({
  id: Number(item?.idParti ?? item?.id ?? 0) || 0,
  destination: String(item?.destino ?? item?.productoNombre ?? "").trim(),
  pointName: String(item?.partidas ?? item?.puntoPartida ?? "").trim(),
  horaPartida: String(item?.horaPartida ?? "").trim(),
  region: String(item?.region ?? "").trim(),
  productId: Number(item?.idProducto ?? item?.productoId ?? 0) || 0,
});

const buildPartidaPayload = (
  data: Partial<DeparturePoint>,
  overrideId?: number,
) => ({
  idParti: overrideId ?? data.id ?? 0,
  idProducto: data.productId ?? 0,
  partidas: data.pointName ?? "",
  horaPartida: data.horaPartida ?? "",
  destino: data.destination ?? "",
});

const resolvePartidaRecord = (
  value: unknown,
  fallback: DeparturePoint,
): DeparturePoint => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const mapped = mapApiPartida(value);
    if (mapped.id) return mapped;
  }
  return fallback;
};
type ProviderWithAccounts = Provider & {
  cuentasBancarias?: ProviderBankAccount[];
};

interface MaintenanceState {
  categories: Category[];
  areas: Area[];
  hotels: Hotel[];
  partidas: DeparturePoint[];
  products: Product[];
  actividadesAdi: ActividadAdi[];
  computers: Computer[];
  providers: Provider[];
  holidays: Holiday[];
  bankEntities: BankEntity[];
  loading: boolean;
  setCategories: (items: Category[]) => void;
  setAreas: (items: Area[]) => void;
  setHotels: (items: Hotel[]) => void;
  setProducts: (items: Product[]) => void;
  setActividadesAdi: (items: ActividadAdi[]) => void;
  setComputers: (items: Computer[]) => void;
  setProviders: (items: Provider[]) => void;
  setHolidays: (items: Holiday[]) => void;
  setBankEntities: (items: BankEntity[]) => void;

  fetchCategories: () => Promise<void>;
  fetchAreas: () => Promise<void>;
  fetchHotels: () => Promise<void>;
  fetchPartidas: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  deleteProduct: (id: number) => Promise<boolean>;
  fetchActividadesAdi: () => Promise<void>;
  fetchComputers: () => Promise<void>;
  fetchProviders: (estado?: "ACTIVO" | "INACTIVO" | "") => Promise<void>;
  fetchHolidays: () => Promise<void>;
  fetchBankEntities: () => Promise<void>;
  addHotel: (data: Omit<Hotel, "id">) => Promise<void>;
  updateHotel: (id: number, data: Partial<Hotel>) => Promise<void>;
  deleteHotel: (id: number) => Promise<boolean>;
  addPartida: (data: Omit<DeparturePoint, "id">) => Promise<void>;
  updatePartida: (id: number, data: Partial<DeparturePoint>) => Promise<void>;
  deletePartida: (id: number) => Promise<boolean>;

  addCategory: (data: Omit<Category, "id">) => Promise<boolean>;
  updateCategory: (id: number, data: Partial<Category>) => Promise<boolean>;
  deleteCategory: (idSubLinea: number) => Promise<boolean>;

  addArea: (data: Omit<Area, "id">) => Promise<boolean>;
  updateArea: (id: number, data: Partial<Area>) => Promise<void>;
  deleteArea: (id: number) => Promise<boolean>;

  addComputer: (data: Omit<Computer, "id">) => Promise<void>;
  updateComputer: (id: number, data: Partial<Computer>) => Promise<void>;
  deleteComputer: (id: number) => Promise<boolean>;

  addProvider: (
    data: ProviderWithAccounts & {
      imageFile?: File | null;
      imageRemoved?: boolean;
    },
  ) => Promise<boolean>;
  updateProvider: (
    id: number,
    data: Partial<ProviderWithAccounts> & {
      imageFile?: File | null;
      imageRemoved?: boolean;
    },
  ) => Promise<boolean>;
  fetchProviderAccounts: (providerId: number) => Promise<ProviderBankAccount[]>;
  deleteProvider: (id: number) => Promise<boolean>;

  addHoliday: (data: Omit<Holiday, "id">) => Promise<void>;
  updateHoliday: (id: number, data: Partial<Holiday>) => Promise<void>;
  deleteHoliday: (id: number) => Promise<boolean>;
  addActividadAdi: (
    payload: ActividadAdiRequest,
    destino: string,
  ) => Promise<boolean>;
  updateActividadAdi: (
    payload: ActividadAdiRequest,
    destino?: string,
  ) => Promise<boolean>;
  deleteActividadAdi: (id: number) => Promise<boolean>;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => {
  const sendProviderAccounts = async (
    providerId: number | undefined,
    accounts?: ProviderBankAccount[],
  ): Promise<boolean> => {
    if (!providerId || !accounts?.length) return true;
    const accountsToSend = accounts.filter((a) => a.action);
    if (!accountsToSend.length) return true;
    for (const account of accountsToSend) {
      const payload = {
        cuentaId: account.cuentaId ?? 0,
        proveedorId: providerId,
        entidad: account.entidad,
        tipoCuenta: account.tipoCuenta,
        moneda: account.moneda,
        nroCuenta: account.nroCuenta,
      };

      if (account.action === "i") {
        const created = await apiRequest<any>({
          url: `${API_BASE_URL}/Proveedor/registerCuenta`,
          method: "POST",
          data: payload,
          config: {
            headers: providerAccountHeaders,
          },
          fallback: account,
        });
        if (
          typeof created === "string" &&
          created.toLowerCase().includes("existe cuenta")
        ) {
          toast.error("La cuenta bancaria ya existe");
          return false;
        }
      } else if (account.action === "u") {
        const updated = await apiRequest<any>({
          url: `${API_BASE_URL}/Proveedor/registerCuenta`,
          method: "POST",
          data: payload,
          config: {
            headers: providerAccountHeaders,
          },
          fallback: account,
        });
        if (
          typeof updated === "string" &&
          updated.toLowerCase().includes("existe cuenta")
        ) {
          toast.error("La cuenta bancaria ya existe");
          return false;
        }
      } else if (account.action === "d") {
        if (!account.cuentaId) continue;
        await apiRequest({
          url: `${API_BASE_URL}/Proveedor/cuentas/${account.cuentaId}`,
          method: "DELETE",
          config: {
            headers: {
              Accept: "*/*",
            },
          },
          fallback: account,
        });
      }
    }
    return true;
  };

  const fetchProviderAccountsFn = async (
    providerId: number,
  ): Promise<ProviderBankAccount[]> => {
    const response = await apiRequest<any[]>({
      url: `${API_BASE_URL}/Proveedor/${providerId}/cuentas`,
      method: "GET",
      config: {
        headers: {
          Accept: "text/plain",
        },
      },
      fallback: [],
    });
    if (!Array.isArray(response)) return [];
    return response.map((item) => mapProviderAccount(item, providerId));
  };

  const buildActividadAdiRecord = (
    payload: ActividadAdiRequest,
    destino: string,
    id: number,
  ): ActividadAdi => ({
    id,
    destino,
    actividad: payload.actividades,
    precioSol: payload.precio,
    entradaSol: payload.entrada,
    precioDol: payload.precioDol,
    entradaDol: payload.entradaDol,
    region: payload.region,
    idProducto: payload.idProducto,
    descripcion: payload.descripcion,
  });

  return {
    categories: [],
    areas: [],
    hotels: [],
    partidas: [],
    products: [],
    actividadesAdi: [],
    computers: [],
    providers: [],
    holidays: [],
    bankEntities: [],
    loading: false,
    setCategories: (items) => set({ categories: items }),
    setAreas: (items) => set({ areas: items }),
    setHotels: (items) => set({ hotels: items }),
    setPartidas: (items) => set({ partidas: items }),
    setProducts: (items) => set({ products: items }),
    setActividadesAdi: (items) => set({ actividadesAdi: items }),
    setComputers: (items) => set({ computers: items }),
    setProviders: (items) => set({ providers: items }),
    setHolidays: (items) => set({ holidays: items }),
    setBankEntities: (items) => set({ bankEntities: items }),

    fetchCategories: async () => {
      set({ loading: true });

      try {
        const response = await queryClient.fetchQuery({
          queryKey: categoriesQueryKey,
          queryFn: fetchCategoriesApi,
        });
        set({
          categories: response ?? [],
          loading: false,
        });
      } catch (err) {
        console.error("❌ Error al obtener categorías", err);
        set({ loading: false });
      }
    },

    fetchAreas: async () => {
      set({ loading: true });
      try {
        const response = await queryClient.fetchQuery({
          queryKey: areasQueryKey,
          queryFn: fetchAreasApi,
        });
        set({ areas: response ?? [], loading: false });
      } catch (err) {
        console.error("Error al obtener áreas", err);
        set({ loading: false });
      }
    },

    fetchHotels: async () => {
      set({ loading: true });
      try {
        const response = await queryClient.fetchQuery({
          queryKey: hotelsQueryKey,
          queryFn: fetchHotelsApi,
        });
        set({ hotels: response ?? [], loading: false });
      } catch (err) {
        console.error("Error al obtener hoteles", err);
        set({ loading: false });
      }
    },
    fetchPartidas: async () => {
      set({ loading: true });
      try {
        const response = await queryClient.fetchQuery({
          queryKey: partidasQueryKey,
          queryFn: fetchPartidasApi,
        });
        set({ partidas: response ?? [], loading: false });
      } catch (err) {
        console.error("Error al obtener puntos de partida", err);
        set({ loading: false });
      }
    },
    fetchProducts: async () => {
      set({ loading: true });
      try {
        const response = await queryClient.fetchQuery({
          queryKey: productsQueryKey,
          queryFn: fetchProductsApi,
        });
        set({ products: response ?? [], loading: false });
      } catch (err) {
        console.error("Error al obtener productos", err);
        set({ loading: false });
      }
    },
    deleteProduct: async (id) => {
      try {
        const result = await deleteProductApi(id);
        const success =
          result === true ||
          result === "true" ||
          (typeof result === "object" && Object.keys(result).length > 0);
        if (!success) return false;
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        }));
        await queryClient.invalidateQueries({ queryKey: productsQueryKey });
        showToast({
          title: "Producto eliminado",
          description: "El producto fue eliminado correctamente.",
          type: "success",
        });
        return true;
      } catch (error) {
        console.error("Error al eliminar producto", error);
        return false;
      }
    },
    fetchActividadesAdi: async () => {
      set({ loading: true });
      try {
        const response = await queryClient.fetchQuery({
          queryKey: actividadesAdiQueryKey,
          queryFn: fetchActividadesAdiApi,
        });
        set({ actividadesAdi: response ?? [], loading: false });
      } catch (err) {
        console.error("Error al obtener actividades adicionales", err);
        set({ loading: false });
      }
    },

    addHotel: async (data) => {
      const payload = buildHotelPayload(data);
      const fallbackHotel = mapApiHotel({ ...payload, idHotel: Date.now() });
      const created = await apiRequest({
        url: HOTEL_ENDPOINT,
        method: "POST",
        data: payload,
        fallback: fallbackHotel,
      });
      const hotelRecord = resolveHotelRecord(created, fallbackHotel);
      set((state) => ({
        hotels: [
          ...state.hotels.filter((hotel) => hotel.id !== hotelRecord.id),
          hotelRecord,
        ],
      }));
      await queryClient.invalidateQueries({ queryKey: hotelsQueryKey });
      const success =
        created === true ||
        created === "true" ||
        (typeof created === "object" && Boolean((created as any)?.idHotel));
      if (success || hotelRecord.id) {
        showToast({
          title: "Hotel guardado",
          description: `La información de ${hotelRecord.hotel} se guardó correctamente.`,
          type: "success",
        });
      }
      queueServiciosRefresh();
    },
    updateHotel: async (id, data) => {
      const payload = buildHotelPayload(data, id);
      const fallbackHotel = mapApiHotel({ ...payload, idHotel: id });
      const updated = await apiRequest({
        url: HOTEL_ENDPOINT,
        method: "POST",
        data: payload,
        fallback: fallbackHotel,
      });
      const hotelRecord = resolveHotelRecord(updated, fallbackHotel);
      set((state) => ({
        hotels: state.hotels.map((hotel) =>
          hotel.id === id ? hotelRecord : hotel,
        ),
      }));
      await queryClient.invalidateQueries({ queryKey: hotelsQueryKey });
      const success =
        updated === true ||
        updated === "true" ||
        (typeof updated === "object" && Boolean((updated as any)?.idHotel));
      if (success || hotelRecord.id) {
        showToast({
          title: "Hotel actualizado",
          description: `Se actualizó ${hotelRecord.hotel} correctamente.`,
          type: "success",
        });
      }
      queueServiciosRefresh();
    },
    deleteHotel: async (id) => {
      await apiRequest({
        url: `${HOTEL_ENDPOINT}/${id}`,
        method: "DELETE",
        fallback: false,
      });

      set((state) => ({
        hotels: state.hotels.filter((hotel) => hotel.id !== id),
      }));
      await queryClient.invalidateQueries({ queryKey: hotelsQueryKey });
      showToast({
        title: "Hotel eliminado",
        description: "El hotel se eliminó correctamente.",
        type: "success",
      });
      queueServiciosRefresh();
      return true;
    },
    addPartida: async (data) => {
      const payload = buildPartidaPayload(data);
      const fallbackPartida = mapApiPartida({
        ...payload,
        idParti: Date.now(),
      });
      const created = await apiRequest({
        url: PARTIDA_ENDPOINT,
        method: "POST",
        data: payload,
        fallback: fallbackPartida,
      });
      const partidaRecord = resolvePartidaRecord(created, fallbackPartida);
      set((state) => ({
        partidas: [
          ...state.partidas.filter((p) => p.id !== partidaRecord.id),
          partidaRecord,
        ],
      }));
      await queryClient.invalidateQueries({ queryKey: partidasQueryKey });
      await get().fetchPartidas();
      showToast({
        title: "Punto guardado",
        description: `El punto ${partidaRecord.pointName} se guardó correctamente.`,
        type: "success",
      });
      queueServiciosRefresh();
    },
    updatePartida: async (id, data) => {
      const payload = buildPartidaPayload(data, id);
      const fallbackPartida = mapApiPartida({ ...payload, idParti: id });
      const updated = await apiRequest({
        url: PARTIDA_ENDPOINT,
        method: "POST",
        data: payload,
        fallback: fallbackPartida,
      });
      const partidaRecord = resolvePartidaRecord(updated, fallbackPartida);
      set((state) => ({
        partidas: state.partidas.map((partida) =>
          partida.id === id ? partidaRecord : partida,
        ),
      }));
      await queryClient.invalidateQueries({ queryKey: partidasQueryKey });
      await get().fetchPartidas();
      showToast({
        title: "Punto actualizado",
        description: `Se actualizó ${partidaRecord.pointName} correctamente.`,
        type: "success",
      });
      queueServiciosRefresh();
    },
    deletePartida: async (id) => {
      const deleted = await apiRequest({
        url: `${PARTIDA_ENDPOINT}/${id}`,
        method: "DELETE",
        fallback: false,
      });
      const success =
        deleted === true ||
        deleted === "true" ||
        (typeof deleted === "object" && Boolean((deleted as any)?.idParti));
      if (success) {
        set((state) => ({
          partidas: state.partidas.filter((partida) => partida.id !== id),
        }));
        await queryClient.invalidateQueries({ queryKey: partidasQueryKey });
        await get().fetchPartidas();
        showToast({
          title: "Punto eliminado",
          description: "El punto de partida se eliminó correctamente.",
          type: "success",
        });
        queueServiciosRefresh();
        return true;
      }
      showToast({
        title: "Error",
        description: "No se pudo eliminar el punto de partida.",
        type: "error",
      });
      return false;
    },

    fetchComputers: async () => {
      set({ loading: true });
      try {
        const response = await queryClient.fetchQuery({
          queryKey: computersQueryKey,
          queryFn: fetchComputersApi,
        });
        set({ computers: response ?? [], loading: false });
      } catch (err) {
        console.error(err);
        set({ loading: false });
      }
    },
    fetchProviders: async (estado = "ACTIVO") => {
      set({ loading: true });
      try {
        const response = await queryClient.fetchQuery({
          queryKey: [...providersQueryKey, estado],
          queryFn: () => fetchProvidersApi(estado),
        });
        set({ providers: response ?? [], loading: false });
      } catch (err) {
        console.error(err);
        set({ loading: false });
      }
    },
    fetchHolidays: async () => {
      set({ loading: true });
      try {
        const response = await queryClient.fetchQuery({
          queryKey: holidaysQueryKey,
          queryFn: fetchHolidaysApi,
        });
        set({ holidays: response ?? [], loading: false });
      } catch (err) {
        console.error("Error al obtener feriados", err);
        set({ loading: false });
      }
    },
    fetchBankEntities: async () => {
      // Endpoint no disponible actualmente; usar fallback local para evitar llamadas erróneas.
      set({
        bankEntities: [
          { id: 1, nombre: "BCP" },
          { id: 2, nombre: "Interbank" },
          { id: 3, nombre: "Scotiabank" },
        ],
      });
    },

    // CRUD
    addCategory: async (data) => {
      const payload = {
        idSubLinea: 0,
        nombreSublinea: data.nombreSublinea,
        codigoSunat: data.codigoSunat,
      };

      const created = await apiRequest<Category | string>({
        url: `${API_BASE_URL}/Linea/registerlinea`,
        method: "POST",
        data: payload,
        config: {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
          },
        },
        fallback: { ...data, id: Date.now() },
      });

      if (
        typeof created === "string" &&
        created.toLowerCase().includes("existe")
      ) {
        //toast.error("Ya existe esa categoria");
        return false;
      }

      set((state) => ({
        categories: [
          ...state.categories,
          created?.id
            ? created
            : { ...data, id: Date.now(), nombreSublinea: data.nombreSublinea },
        ],
      }));

      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      return true;
    },

    updateCategory: async (id, data) => {
      const payload = {
        idSubLinea: id,
        nombreSublinea: data.nombreSublinea ?? data.nombre ?? "",
        codigoSunat: data.codigoSunat ?? "",
      };

      const updated = await apiRequest<Category | string>({
        url: `${API_BASE_URL}/Linea/registerlinea`,
        method: "POST",
        data: payload,
        config: {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
          },
        },
        fallback: { ...data, id },
      });

      if (
        typeof updated === "string" &&
        updated.toLowerCase().includes("existe")
      ) {
        toast.error("Ya existe esa categoria");
        return false;
      }

      set((state) => ({
        categories: state.categories.map((c) =>
          String(c.id) === String(id)
            ? updated?.id
              ? updated
              : { ...c, ...data, id }
            : c,
        ),
      }));

      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      return true;
    },

    deleteCategory: async (idSubLinea) => {
      const result = await apiRequest({
        url: `${API_BASE_URL}/Linea/${idSubLinea}`,
        method: "DELETE",
        config: {
          headers: {
            Accept: "*/*",
          },
        },
        fallback: null,
      });
      if (!result) {
        return false;
      } else {
        set((state) => ({
          categories: state.categories.filter(
            (c) => String(c.id) !== String(idSubLinea),
          ),
        }));

        await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
        return true;
      }
    },

    addArea: async (data) => {
      const payload = {
        areaId: 0,
        areaNombre: data.area,
      };

      const created = await apiRequest<{
        areaId?: number;
        areaNombre?: string;
      }>({
        url: `${API_BASE_URL}/Area/registerarea`,
        method: "POST",
        data: payload,
        config: {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
          },
        },
        fallback: { ...data, id: Date.now() },
      });

      if (
        typeof created === "string" &&
        created.toLowerCase().includes("existe")
      ) {
        //  toast.error("Ya existe esta area");
        return false;
      }

      const hasCreatedId =
        created &&
        typeof created === "object" &&
        ("areaId" in (created as any) || "id" in (created as any));

      if (hasCreatedId) {
        const idValue = (created as any).id ?? (created as any).areaId;
        const areaValue =
          (created as any).nombre ?? (created as any).areaNombre ?? data.area;
        set((state) => ({
          areas: [...state.areas, { id: idValue, area: areaValue }],
        }));
      } else {
        set((state) => ({
          areas: [...state.areas, { ...data, id: Date.now() }],
        }));
      }
      await queryClient.invalidateQueries({ queryKey: areasQueryKey });
      return true;
    },
    updateArea: async (id, data) => {
      const payload = {
        areaId: id,
        areaNombre: data.area ?? "",
      };

      const updated = await apiRequest<{
        areaId?: number;
        areaNombre?: string;
      }>({
        url: `${API_BASE_URL}/Area/${id}`,
        method: "PUT",
        data: payload,
        config: {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
          },
        },
        fallback: { ...data, id },
      });

      set((state) => ({
        areas: state.areas.map((a) => {
          if (a.id !== id) return a;
          const hasUpdatedId =
            updated &&
            typeof updated === "object" &&
            ("areaId" in (updated as any) || "id" in (updated as any));
          if (hasUpdatedId) {
            return {
              id: (updated as any).id ?? (updated as any).areaId ?? id,
              area:
                (updated as any).nombre ??
                (updated as any).areaNombre ??
                data.area ??
                a.area,
            };
          }
          return { ...a, ...data };
        }),
      }));

      await queryClient.invalidateQueries({ queryKey: areasQueryKey });
    },
    deleteArea: async (id) => {
      const result = await apiRequest({
        url: `${API_BASE_URL}/Area/${id}`,
        method: "DELETE",
        config: {
          headers: {
            Accept: "*/*",
          },
        },
        fallback: null,
      });

      if (!result) {
        return false;
      }

      set((state) => ({ areas: state.areas.filter((a) => a.id !== id) }));
      await queryClient.invalidateQueries({ queryKey: areasQueryKey });
      return true;
    },

    addComputer: async (data) => {
      const payload = {
        idMaquina: 0,
        nombreMaquina: data.maquina,
        registro: data.registro,
        serieFactura: data.serieFactura,
        serieNC: data.serieNc,
        serieBoleta: data.serieBoleta,
        tiketera: data.ticketera,
      };

      const created = await apiRequest<{
        idMaquina?: number;
        nombreMaquina?: string;
        registro?: string;
        serieFactura?: string;
        serieNC?: string;
        serieBoleta?: string;
        tiketera?: string;
      }>({
        url: `${API_BASE_URL}/Maquina/registermaquina`,
        method: "POST",
        data: payload,
        config: {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
          },
        },
        fallback: { ...data, id: Date.now() },
      });

      if (
        typeof created === "string" &&
        created.toLowerCase().includes("existe")
      ) {
        toast.error("Ya existe esta maquina registrada");
        return false;
      }

      if (
        created &&
        typeof created === "object" &&
        ("idMaquina" in created || "id" in created)
      ) {
        set((state) => ({
          computers: [
            ...state.computers,
            {
              id: (created as any).id ?? (created as any).idMaquina,
              maquina: (created as any).nombreMaquina ?? data.maquina,
              registro: (created as any).registro ?? data.registro,
              serieFactura: (created as any).serieFactura ?? data.serieFactura,
              serieNc: (created as any).serieNC ?? data.serieNc,
              serieBoleta: (created as any).serieBoleta ?? data.serieBoleta,
              ticketera: (created as any).tiketera ?? data.ticketera,
              areaId: data.areaId ?? 0,
            },
          ],
        }));
      } else {
        set((state) => ({
          computers: [...state.computers, { ...data, id: Date.now() }],
        }));
      }

      await queryClient.invalidateQueries({ queryKey: computersQueryKey });
      return true;
    },
    updateComputer: async (id, data) => {
      const payload = {
        idMaquina: id,
        nombreMaquina: data.maquina ?? "",
        registro: data.registro ?? "",
        serieFactura: data.serieFactura ?? "",
        serieNC: data.serieNc ?? "",
        serieBoleta: data.serieBoleta ?? "",
        tiketera: data.ticketera ?? "",
      };

      const updated = await apiRequest<{
        idMaquina?: number;
        nombreMaquina?: string;
        registro?: string;
        serieFactura?: string;
        serieNC?: string;
        serieBoleta?: string;
        tiketera?: string;
      }>({
        url: `${API_BASE_URL}/Maquina/registermaquina`,
        method: "POST",
        data: payload,
        config: {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
          },
        },
        fallback: { ...data, id },
      });

      if (
        typeof updated === "string" &&
        updated.toLowerCase().includes("existe")
      ) {
        toast.error("Ya existe un registro con ese nombre");
        return false;
      }

      set((state) => ({
        computers: state.computers.map((c) => {
          if (c.id !== id) return c;
          if (
            updated &&
            typeof updated === "object" &&
            ("idMaquina" in (updated as any) || "id" in (updated as any))
          ) {
            return {
              id: (updated as any).id ?? (updated as any).idMaquina ?? id,
              maquina:
                (updated as any).nombreMaquina ?? data.maquina ?? c.maquina,
              registro:
                (updated as any).registro ?? data.registro ?? c.registro,
              serieFactura:
                (updated as any).serieFactura ??
                data.serieFactura ??
                c.serieFactura,
              serieNc: (updated as any).serieNC ?? data.serieNc ?? c.serieNc,
              serieBoleta:
                (updated as any).serieBoleta ??
                data.serieBoleta ??
                c.serieBoleta,
              ticketera:
                (updated as any).tiketera ?? data.ticketera ?? c.ticketera,
              areaId: c.areaId,
            };
          }
          return { ...c, ...data };
        }),
      }));

      await queryClient.invalidateQueries({ queryKey: computersQueryKey });
      return true;
    },
    deleteComputer: async (id) => {
      const result = await apiRequest({
        url: `${API_BASE_URL}/Maquina/${id}`,
        method: "DELETE",
        config: {
          headers: {
            Accept: "*/*",
          },
        },
        fallback: null,
      });

      if (!result) {
        return false;
      }

      set((state) => ({
        computers: state.computers.filter((c) => c.id !== id),
      }));
      await queryClient.invalidateQueries({ queryKey: computersQueryKey });
      return true;
    },

    addProvider: async (
      data: ProviderWithAccounts & {
        imageFile?: File | null;
        imageRemoved?: boolean;
      },
    ) => {
      const payload = {
        proveedorId: 0,
        proveedorRazon: data.razon,
        proveedorRuc: data.ruc,
        proveedorContacto: data.contacto,
        proveedorCelular: data.celular,
        proveedorTelefono: data.telefono,
        proveedorCorreo: data.correo,
        proveedorDireccion: data.direccion,
        proveedorEstado: data.estado,
        eliminarImagen: data.imageRemoved ? "true" : undefined,
      };

      const hasFile = data.imageFile instanceof File;
      const requestData = hasFile ? new FormData() : payload;
      const requestConfig = hasFile
        ? undefined
        : {
            headers: {
              Accept: "*/*",
              "Content-Type": "application/json",
            },
          };

      if (hasFile && requestData instanceof FormData) {
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined) return;
          requestData.append(key, value ?? "");
        });
        requestData.append("imagen", data.imageFile as File);
      }

      const created = await apiRequest<any>({
        url: `${API_BASE_URL}/Proveedor/register`,
        method: "POST",
        data: requestData as any,
        config: requestConfig,
        fallback: { ...data, id: Date.now() },
      });

      if (
        typeof created === "string" &&
        created.toLowerCase().includes("existe") &&
        created.toLowerCase().includes("ruc")
      ) {
        toast.error(created);
        return false;
      }

      const hasCreatedId =
        created &&
        typeof created === "object" &&
        ("proveedorId" in (created as any) || "id" in (created as any));
      const providerId = hasCreatedId
        ? Number((created as any).id ?? (created as any).proveedorId)
        : undefined;

      if (data.cuentasBancarias?.length) {
        const okAccounts = await sendProviderAccounts(
          providerId,
          data.cuentasBancarias,
        );
        if (!okAccounts) return false;
      }

      const mapped = hasCreatedId
        ? {
            id: (created as any).id ?? (created as any).proveedorId,
            razon:
              (created as any).proveedorRazon ??
              (created as any).razon ??
              data.razon,
            ruc: (created as any).proveedorRuc ?? data.ruc,
            contacto: (created as any).proveedorContacto ?? data.contacto,
            celular: (created as any).proveedorCelular ?? data.celular,
            telefono: (created as any).proveedorTelefono ?? data.telefono,
            correo: (created as any).proveedorCorreo ?? data.correo,
            direccion: (created as any).proveedorDireccion ?? data.direccion,
            estado: (created as any).proveedorEstado ?? data.estado,
            imagen:
              (created as any).proveedorImagen ??
              (created as any).imagen ??
              null,
            images:
              (created as any).proveedorImagen || (created as any).imagen
                ? [
                    String(
                      (created as any).proveedorImagen ??
                        (created as any).imagen,
                    ),
                  ]
                : [],
            cuentasBancarias: data.cuentasBancarias,
          }
        : { ...data, id: Date.now(), images: [], imagen: null };

      set((state) => ({
        providers: [...state.providers, mapped as Provider],
      }));

      await queryClient.invalidateQueries({ queryKey: providersQueryKey });
      return true;
    },

    updateProvider: async (
      id,
      data: Partial<ProviderWithAccounts> & {
        imageFile?: File | null;
        imageRemoved?: boolean;
      },
    ) => {
      const payload = {
        proveedorId: id,
        proveedorRazon: data.razon ?? "",
        proveedorRuc: data.ruc ?? "",
        proveedorContacto: data.contacto ?? "",
        proveedorCelular: data.celular ?? "",
        proveedorTelefono: data.telefono ?? "",
        proveedorCorreo: data.correo ?? "",
        proveedorDireccion: data.direccion ?? "",
        proveedorEstado: data.estado ?? "",
        eliminarImagen: data.imageRemoved ? "true" : undefined,
      };

      const hasFile = data.imageFile instanceof File;
      const requestData = hasFile ? new FormData() : payload;
      const requestConfig = hasFile
        ? undefined
        : {
            headers: {
              Accept: "*/*",
              "Content-Type": "application/json",
            },
          };

      if (hasFile && requestData instanceof FormData) {
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined) return;
          requestData.append(key, value ?? "");
        });
        requestData.append("imagen", data.imageFile as File);
      }

      const updated = await apiRequest<any>({
        url: `${API_BASE_URL}/Proveedor/register`,
        method: "POST",
        data: requestData as any,
        config: requestConfig,
        fallback: { ...data, id },
      });

      if (
        typeof updated === "string" &&
        updated.toLowerCase().includes("existe") &&
        updated.toLowerCase().includes("ruc")
      ) {
        toast.error(updated);
        return false;
      }

      if (data.cuentasBancarias?.length) {
        const okAccounts = await sendProviderAccounts(
          id,
          data.cuentasBancarias,
        );
        if (!okAccounts) return false;
      }

      set((state) => ({
        providers: state.providers.map((p) => {
          if (p.id !== id) return p;
          const hasUpdatedId =
            updated &&
            typeof updated === "object" &&
            ("proveedorId" in (updated as any) || "id" in (updated as any));
          if (hasUpdatedId) {
            return {
              id: (updated as any).id ?? (updated as any).proveedorId ?? id,
              razon:
                (updated as any).proveedorRazon ??
                (updated as any).razon ??
                data.razon ??
                p.razon,
              ruc: (updated as any).proveedorRuc ?? data.ruc ?? p.ruc,
              contacto:
                (updated as any).proveedorContacto ??
                data.contacto ??
                p.contacto,
              celular:
                (updated as any).proveedorCelular ?? data.celular ?? p.celular,
              telefono:
                (updated as any).proveedorTelefono ??
                data.telefono ??
                p.telefono,
              correo:
                (updated as any).proveedorCorreo ?? data.correo ?? p.correo,
              direccion:
                (updated as any).proveedorDireccion ??
                data.direccion ??
                p.direccion,
              estado:
                (updated as any).proveedorEstado ?? data.estado ?? p.estado,
              imagen:
                (updated as any).proveedorImagen ??
                (updated as any).imagen ??
                p.imagen ??
                null,
              images:
                (updated as any).proveedorImagen || (updated as any).imagen
                  ? [
                      String(
                        (updated as any).proveedorImagen ??
                          (updated as any).imagen,
                      ),
                    ]
                  : (p.images ?? []),
              cuentasBancarias: data.cuentasBancarias ?? p.cuentasBancarias,
            };
          }
          return {
            ...p,
            ...data,
            cuentasBancarias: data.cuentasBancarias ?? p.cuentasBancarias,
          };
        }),
      }));

      await queryClient.invalidateQueries({ queryKey: providersQueryKey });
      return true;
    },

    deleteProvider: async (id) => {
      const result = await apiRequest({
        url: `${API_BASE_URL}/Proveedor/${id}`,
        method: "DELETE",
        config: {
          headers: {
            Accept: "*/*",
          },
        },
        fallback: null,
      });

      if (!result) {
        return false;
      }

      set((state) => ({
        providers: state.providers.filter((p) => p.id !== id),
      }));
      await queryClient.invalidateQueries({ queryKey: providersQueryKey });
      return true;
    },

    addHoliday: async (data) => {
      const created = await saveHolidayApi({
        id: 0,
        fecha: data.fecha,
        motivo: data.motivo?.toUpperCase?.() ?? data.motivo,
      });

      if (isDuplicateHoliday(created)) {
        toast.error("Esa fecha ya está registrada");
        return false;
      }

      set((state) => ({
        holidays: [
          ...state.holidays.filter((h) => String(h.id) !== String(created.id)),
          created as any,
        ],
      }));

      await queryClient.invalidateQueries({ queryKey: holidaysQueryKey });
      return true;
    },

    updateHoliday: async (id, data) => {
      const updated = await saveHolidayApi({
        id,
        fecha: data.fecha ?? "",
        motivo: data.motivo?.toUpperCase?.() ?? data.motivo ?? "",
      });

      if (isDuplicateHoliday(updated)) {
        toast.error("Esa fecha ya está registrada");
        return false;
      }

      set((state) => ({
        holidays: state.holidays.map((h) =>
          String(h.id) === String(id) ? { ...h, ...updated } : h,
        ),
      }));

      await queryClient.invalidateQueries({ queryKey: holidaysQueryKey });
      return true;
    },

    deleteHoliday: async (id) => {
      const result = await deleteHolidayApi(id);
      if (!result) return false;

      set((state) => ({
        holidays: state.holidays.filter((h) => h.id !== id),
      }));

      await queryClient.invalidateQueries({ queryKey: holidaysQueryKey });
      return true;
    },
    addActividadAdi: async (payload, destino) => {
      try {
        const response = await registerActividadAdiApi(payload);
        const candidate =
          typeof response === "number"
            ? response
            : Number((response as any)?.idActi ?? response ?? 0);
        const newId =
          Number.isFinite(candidate) && candidate > 0 ? candidate : Date.now();
        const record = buildActividadAdiRecord(payload, destino, newId);
        set((state) => ({
          actividadesAdi: [
            ...state.actividadesAdi.filter((item) => item.id !== record.id),
            record,
          ],
        }));
        await queryClient.invalidateQueries({
          queryKey: actividadesAdiQueryKey,
        });
        queueServiciosRefresh();
        return true;
      } catch (error) {
        console.error("Error al registrar actividad adicional", error);
        return false;
      }
    },
    updateActividadAdi: async (payload, destino) => {
      try {
        const result = await updateActividadAdiApi(payload);
        const success =
          result === true ||
          result === "true" ||
          (typeof result === "object" && Object.keys(result).length > 0);
        if (!success) return false;
        const record = buildActividadAdiRecord(
          payload,
          destino ?? "",
          payload.idActi ?? 0,
        );
        set((state) => ({
          actividadesAdi: state.actividadesAdi.map((item) =>
            item.id === record.id ? { ...item, ...record } : item,
          ),
        }));
        await queryClient.invalidateQueries({
          queryKey: actividadesAdiQueryKey,
        });
        queueServiciosRefresh();
        return true;
      } catch (error) {
        console.error("Error al actualizar actividad adicional", error);
        return false;
      }
    },
    deleteActividadAdi: async (id) => {
      try {
        const result = await deleteActividadAdiApi(id);
        const success =
          result === true ||
          result === "true" ||
          (typeof result === "object" && Object.keys(result).length > 0);
        if (!success) return false;
        set((state) => ({
          actividadesAdi: state.actividadesAdi.filter(
            (actividad) => actividad.id !== id,
          ),
        }));
        await queryClient.invalidateQueries({
          queryKey: actividadesAdiQueryKey,
        });
        showToast({
          title: "Actividad eliminada",
          description: "La actividad adicional fue eliminada.",
          type: "success",
        });
        queueServiciosRefresh();
        return true;
      } catch (error) {
        console.error("Error al eliminar actividad adicional", error);
        return false;
      }
    },
    fetchProviderAccounts: fetchProviderAccountsFn,
  };
});
