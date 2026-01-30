import { useQuery } from "@tanstack/react-query";

import {
  fetchActividadesAdiApi,
  actividadesAdiQueryKey,
} from "./actividadesAdi.api";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";

export function useActividadesAdiQuery() {
  const setActividadesAdi = useMaintenanceStore((s) => s.setActividadesAdi);

  return useQuery({
    queryKey: actividadesAdiQueryKey,
    queryFn: fetchActividadesAdiApi,
    staleTime: 1000 * 60,
    onSuccess: (data) => setActividadesAdi(data ?? []),
  });
}
