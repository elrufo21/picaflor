import type { Product } from "@/types/maintenance";
import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";

const PRODUCT_LIST_ENDPOINT = `${API_BASE_URL}/Productos/listaPro?companiaId=1`;
const PRODUCT_REGISTER_ENDPOINT = `${API_BASE_URL}/Productos/register`;

export const productsQueryKey = ["products"] as const;

export type ProductPayload = {
  idProducto: number;
  idSubLinea: number;
  ProductoCodigo: string;
  ProductoNombre: string;
  ProductoTipoCambio: number;
  ProductoCostoDolar: number;
  ProductoUM: string;
  ProductoCosto: number;
  ProductoVenta: number;
  ProductoVentaB: number;
  ProductoCantidad: number;
  ProductoEstado: string;
  ProductoUsuario: string;
  ProductoFecha: string;
  ProductoImagen: string;
  ValorCritico: number;
  AplicaTC: string;
  AplicaINV: string;
  CompaniaId: number;
  VisitasExCur: string;
  CantMaxPAX: number;
  Region: string;
};

const toString = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);
const toNullableString = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
};

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const mapProduct = (item: any): Product => ({
  id: Number(item?.id ?? 0) || 0,
  categoria: toString(item?.categoria),
  codigo: toString(item?.codigo),
  descripcion: toString(item?.descripcion ?? item?.productoNombre),
  precio: toNumber(item?.precio),
  ventaSoles: toNumber(item?.ventaSoles),
  ventaDolar: toNumber(item?.ventaDolar),
  preCosto: toNumber(item?.preCosto),
  vencimiento: toString(item?.vencimiento),
  aplicaFV: toString(item?.aplicaFV),
  estado: toString(item?.estado),
  usuario: toString(item?.usuario),
  registro: toNumber(item?.registro),
  stock: toNumber(item?.stock),
  cantidad: toNumber(item?.cantidad),
  cantMaxPax: toNumber(item?.cantMaxPax),
  cantFIS: toNullableNumber(item?.cantFIS),
  imagen: toString(item?.imagen),
  cantANT: toNumber(item?.cantANT),
  fechaEdicion: toString(item?.fechaEdicion),
  inversion: toNullableNumber(item?.inversion),
  ventaNeta: toNumber(item?.ventaNeta),
  margenUtilidad: toNumber(item?.margenUtilidad),
  valorCritico: toNullableNumber(item?.valorCritico),
  aplicaTC: toString(item?.aplicaTC),
  costoDolar: toNullableNumber(item?.costoDolar),
  tipoCambio: toNullableNumber(item?.tipoCambio),
  aplicaINV: toNullableString(item?.aplicaINV),
  unidadM: toNullableString(item?.unidadM),
  visitasExCur: toNullableString(item?.visitasExCur),
  region: toNullableString(item?.region),
  unidad: toNullableString(item?.unidad),
  valorUM: toNumber(item?.valorUM),
});

export const fetchProductsApi = async (): Promise<Product[]> => {
  try {
    const response = await fetch(PRODUCT_LIST_ENDPOINT, {
      headers: {
        accept: "text/plain",
      },
    });
    if (!response.ok) {
      throw new Error(`Listado de productos falló: ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("El listado de productos debe ser un arreglo");
    }
    return payload.map(mapProduct);
  } catch (error) {
    console.error("Error fetching products", error);
    return [];
  }
};

const buildProductFormData = (payload: ProductPayload) => {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    form.append(
      key,
      value === null || value === undefined ? "" : String(value),
    );
  });
  return form;
};

export const saveProductApi = async (payload: ProductPayload) => {
  const formData = buildProductFormData(payload);
  return apiRequest({
    url: PRODUCT_REGISTER_ENDPOINT,
    method: "POST",
    data: formData,
    config: {
      headers: {
        Accept: "*/*",
      },
    },
  });
};

export const updateProductApi = async (payload: ProductPayload) => {
  return apiRequest({
    url: `${API_BASE_URL}/Productos/${payload.idProducto}`,
    method: "PUT",
    data: payload,
    config: {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    },
  });
};
export const deleteProductApi = async (id: number) => {
  return apiRequest({
    url: `${API_BASE_URL}/Productos/`,
    method: "DELETE",
    config: {
      headers: {
        Accept: "*/*",
      },
    },
  });
};
