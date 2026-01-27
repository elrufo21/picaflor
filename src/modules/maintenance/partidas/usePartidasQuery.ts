import { useQuery } from "@tanstack/react-query";

import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { fetchPartidasApi, partidasQueryKey } from "./partidas.api";

export function usePartidasQuery() {
  const setPartidas = useMaintenanceStore((s) => s.setPartidas);

  return useQuery({
    queryKey: partidasQueryKey,
    queryFn: fetchPartidasApi,
    staleTime: 1000 * 60,
    onSuccess: (data) => setPartidas(data ?? []),
  });
}
