import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { areasQueryKey, fetchAreasApi } from "./areas.api";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

export function useAreasQuery() {
  const setAreas = useMaintenanceStore((s) => s.setAreas);

  const query = useQuery({
    queryKey: areasQueryKey,
    queryFn: fetchAreasApi,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (!query.data) return;
    setAreas(query.data ?? []);
  }, [query.data, setAreas]);

  return query;
}
