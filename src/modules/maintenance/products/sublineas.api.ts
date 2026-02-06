import { API_BASE_URL } from "@/config";
import { cacheFirst } from "@/shared/indexedDB/cache";
import { safeFetchJson } from "@/shared/http/safeFetch";

export const productSublineasQueryKey = ["product-sublineas"] as const;

const SUBLINEA_ENDPOINT = `${API_BASE_URL}/Productos/sublineas`;
const SUBLINEA_CACHE_KEY = "product-sublineas";
const SUBLINEA_CACHE_TTL = 1000 * 60 * 30; // 30 minutos

export type ProductSublinea = {
  id: string;
  nombreSublinea: string | null;
};

const mapSublinea = (item: any): ProductSublinea => ({
  id: String(item?.id ?? ""),
  nombreSublinea: item?.nombreSublinea
    ? String(item.nombreSublinea)
    : null,
});

const fetchSublineasFromApi = async (): Promise<ProductSublinea[]> => {
  const payload = await safeFetchJson<unknown[]>(SUBLINEA_ENDPOINT, {
    headers: { accept: "text/plain" },
  });
  if (!Array.isArray(payload)) {
    throw new Error("Sublineas response must be an array");
  }
  return payload
    .map(mapSublinea)
    .filter((item) => Boolean(item.nombreSublinea));
};

export const fetchProductSublineas = () =>
  cacheFirst({
    key: SUBLINEA_CACHE_KEY,
    ttl: SUBLINEA_CACHE_TTL,
    fetcher: fetchSublineasFromApi,
    fallback: [],
  });
