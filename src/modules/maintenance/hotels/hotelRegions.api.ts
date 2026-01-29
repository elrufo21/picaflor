import { API_BASE_URL } from "@/config";
import type { Hotel } from "@/types/maintenance";

export type HotelRegion = {
  idRegion: string;
  nombre: string;
};

const REGION_ENDPOINT = `${API_BASE_URL}/Hotel/regiones`;

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

export const fetchHotelRegions = async (): Promise<HotelRegion[]> => {
  try {
    const response = await fetch(REGION_ENDPOINT, {
      headers: {
        accept: "text/plain",
      },
    });
    if (!response.ok) {
      throw new Error(`Hotel regions request failed: ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Hotel regions response is not an array");
    }
    return payload
      .map(mapRegionEntry)
      .filter(isValidRegion);
  } catch (error) {
    console.error("Error fetching hotel regions", error);
    return FALLBACK_REGIONS;
  }
};
