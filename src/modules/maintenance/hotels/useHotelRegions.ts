import { useQuery } from "@tanstack/react-query";

import { fetchHotelRegions } from "./hotelRegions.api";

export const hotelRegionsQueryKey = ["hotel-regions"] as const;

export function useHotelRegions() {
  return useQuery({
    queryKey: hotelRegionsQueryKey,
    queryFn: fetchHotelRegions,
    staleTime: 1000 * 60 * 5,
  });
}
