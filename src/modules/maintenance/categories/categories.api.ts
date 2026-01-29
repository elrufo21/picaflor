import type { Category } from "@/types/maintenance";
import { apiRequest } from "@/shared/helpers/apiRequest";
import { API_BASE_URL } from "@/config";

export const categoriesQueryKey = ["categories"] as const;

export const fetchCategoriesApi = async (): Promise<Category[]> => {
  const response = await apiRequest<Category[]>({
    url: `${API_BASE_URL}/Linea/list`,
    method: "GET",
    fallback: [],
  });
  return response ?? [];
};
