import { API_BASE_URL } from "@/config";
import { cacheFirst } from "@/shared/indexedDB/cache";
import { safeFetchJson } from "@/shared/http/safeFetch";

export type HotelRegion = {
  idRegion: string;
  nombre: string;
};

const REGION_ENDPOINT = `${API_BASE_URL}/Hotel/regiones`;
const REGION_CACHE_KEY = "hotel-regions";
const REGION_CACHE_TTL = 1000 * 60 * 60; // 1 hour

const FALLBACK_REGIONS: HotelRegion[] = [
  { idRegion: "1", nombre: "AMAZONAS" },
  { idRegion: "93", nombre: "ANCASH" },
  { idRegion: "280", nombre: "APURIMAC" },
  { idRegion: "368", nombre: "AREQUIPA" },
  { idRegion: "486", nombre: "AYACUCHO" },
  { idRegion: "615", nombre: "CAJAMARCA" },
  { idRegion: "756", nombre: "CALLAO" },
];

const mapRegionEntry = (item: any): HotelRegion => ({
  idRegion: String(item?.idRegion ?? item?.id ?? ""),
  nombre: String(item?.nombre ?? item?.nombreRegion ?? "").toUpperCase(),
});

const isValidRegion = (region: HotelRegion) =>
  Boolean(region.idRegion && region.nombre);

const fetchRegionsFromApi = async (): Promise<HotelRegion[]> => {
  const payload = await safeFetchJson<unknown[]>(REGION_ENDPOINT, {
    headers: { accept: "text/plain" },
  });
  if (!Array.isArray(payload)) {
    throw new Error("Hotel regions response is not an array");
  }
  return payload.map(mapRegionEntry).filter(isValidRegion);
};

export const fetchHotelRegions = () =>
  cacheFirst({
    key: REGION_CACHE_KEY,
    ttl: REGION_CACHE_TTL,
    fetcher: fetchRegionsFromApi,
    fallback: FALLBACK_REGIONS,
  });
