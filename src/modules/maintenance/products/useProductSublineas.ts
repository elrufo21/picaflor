import { useQuery } from "@tanstack/react-query";

import { fetchProductSublineas, productSublineasQueryKey } from "./sublineas.api";

export function useProductSublineas() {
  return useQuery({
    queryKey: productSublineasQueryKey,
    queryFn: fetchProductSublineas,
    staleTime: 1000 * 60,
  });
}
