import { API_BASE_URL } from "@/config";

export const productSublineasQueryKey = ["product-sublineas"] as const;

const SUBLINEA_ENDPOINT = `${API_BASE_URL}/Productos/sublineas`;

export type ProductSublinea = {
  id: string;
  nombreSublinea: string | null;
};

const mapSublinea = (item: any): ProductSublinea => ({
  id: String(item?.id ?? ""),
  nombreSublinea: item?.nombreSublinea
    ? String(item.nombreSublinea)
    : null,
});

export const fetchProductSublineas = async (): Promise<ProductSublinea[]> => {
  try {
    const response = await fetch(SUBLINEA_ENDPOINT, {
      headers: {
        accept: "text/plain",
      },
    });
    if (!response.ok) {
      throw new Error(`Sublineas request failed: ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Sublineas response must be an array");
    }
    return payload
      .map(mapSublinea)
      .filter((item) => Boolean(item.nombreSublinea));
  } catch (error) {
    console.error("Error fetching sublineas", error);
    return [];
  }
};
