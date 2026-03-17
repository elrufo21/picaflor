import type { Product } from "@/types/maintenance";
import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";

const PRODUCT_LIST_ENDPOINT = `${API_BASE_URL}/Productos/listaPro?companiaId=1`;
const PRODUCT_REGISTER_ENDPOINT = `${API_BASE_URL}/Productos/register`;

export const productsQueryKey = ["products"] as const;

export type ProductPayload = {
  IdProducto: number;
  IdSubLinea: number;
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
  ProductoImagen: string;
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
  id: Number(item?.id ?? item?.idProducto ?? item?.IdProducto ?? 0) || 0,
  categoria: toString(
    item?.categoria ?? item?.nombreSublinea ?? item?.sublinea ?? "",
  ),
  codigo: toString(item?.codigo ?? item?.productoCodigo ?? item?.ProductoCodigo),
  descripcion: toString(
    item?.descripcion ?? item?.productoNombre ?? item?.ProductoNombre,
  ),
  precio: toNumber(item?.precio ?? item?.productoCosto ?? item?.ProductoCosto),
  ventaSoles: toNumber(
    item?.ventaSoles ?? item?.productoVenta ?? item?.ProductoVenta,
  ),
  ventaDolar: toNumber(
    item?.ventaDolar ?? item?.productoVentaB ?? item?.ProductoVentaB,
  ),
  preCosto: toNumber(item?.preCosto ?? item?.productoCosto ?? item?.ProductoCosto),
  vencimiento: toString(item?.vencimiento),
  aplicaFV: toString(item?.aplicaFV),
  estado: toString(item?.estado ?? item?.productoEstado ?? item?.ProductoEstado),
  usuario: toString(
    item?.usuario ?? item?.productoUsuario ?? item?.ProductoUsuario,
  ),
  registro: toNumber(item?.registro),
  stock: toNumber(item?.stock),
  cantidad: toNumber(
    item?.cantidad ?? item?.productoCantidad ?? item?.ProductoCantidad,
  ),
  cantMaxPax: toNumber(item?.cantMaxPax ?? item?.cantMaxPAX ?? item?.CantMaxPAX),
  cantFIS: toNullableNumber(item?.cantFIS),
  imagen: toString(item?.imagen ?? item?.productoImagen ?? item?.ProductoImagen),
  cantANT: toNumber(item?.cantANT),
  fechaEdicion: toString(item?.fechaEdicion),
  inversion: toNullableNumber(item?.inversion),
  ventaNeta: toNumber(item?.ventaNeta),
  margenUtilidad: toNumber(item?.margenUtilidad),
  valorCritico: toNullableNumber(item?.valorCritico),
  aplicaTC: toString(item?.aplicaTC),
  costoDolar: toNullableNumber(
    item?.costoDolar ?? item?.productoCostoDolar ?? item?.ProductoCostoDolar,
  ),
  tipoCambio: toNullableNumber(
    item?.tipoCambio ?? item?.productoTipoCambio ?? item?.ProductoTipoCambio,
  ),
  aplicaINV: toNullableString(item?.aplicaINV),
  unidadM: toNullableString(item?.unidadM ?? item?.productoUM ?? item?.ProductoUM),
  visitasExCur: toNullableString(
    item?.visitasExCur ??
      item?.VisitasExCur ??
      item?.visitasExcur ??
      item?.actividad ??
      item?.Actividad,
  ),
  region: toNullableString(item?.region ?? item?.Region),
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
    url: `${API_BASE_URL}/Productos/${payload.IdProducto}`,
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
    url: `${API_BASE_URL}/Productos/${id}`,
    method: "DELETE",
    config: {
      headers: {
        Accept: "*/*",
      },
    },
  });
};
