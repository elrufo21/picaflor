import { useQuery } from "@tanstack/react-query";

import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { fetchHotelsApi, hotelsQueryKey } from "./hotels.api";

export function useHotelsQuery() {
  const setHotels = useMaintenanceStore((s) => s.setHotels);

  return useQuery({
    queryKey: hotelsQueryKey,
    queryFn: fetchHotelsApi,
    staleTime: 1000 * 60,
    onSuccess: (data) => setHotels(data ?? []),
  });
}
