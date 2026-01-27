import type { Category } from "@/types/maintenance";
import { apiRequest } from "@/shared/helpers/apiRequest";

export const categoriesQueryKey = ["categories"] as const;

export const fetchCategoriesApi = async (): Promise<Category[]> => {
  const response = await apiRequest<Category[]>({
    url: "https://picaflorapi.somee.com/api/v1/Linea/list",
    method: "GET",
    fallback: [],
  });
  return response ?? [];
};
