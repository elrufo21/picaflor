const DEFAULT_API_BASE_URL = "https://picaflorapi.somee.com/api/v1";

const normalizeApiBaseUrl = (value?: string) => {
  if (!value) return DEFAULT_API_BASE_URL;
  const cleaned = value.trim().replace(/\/+$/, "");
  if (!cleaned) return DEFAULT_API_BASE_URL;
  const lower = cleaned.toLowerCase();
  return lower.endsWith("/api/v1") ? cleaned : `${cleaned}/api/v1`;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL,
);

export const ENDPOINTS = {
  personal: "/Personal",
  personalList: "/Personal/list",
  personalRegister: "/Personal/registerpersonal",

  categoriaRegister: "/Linea/registerlinea",
  categoriaById: (id: number | string) => `/Linea/${id}`,

  areaRegister: "/Area/registerarea",
  areaById: (id: number | string) => `/Area/${id}`,

  maquinaRegister: "/Maquina/registermaquina",
  maquinaById: (id: number | string) => `/Maquina/${id}`,
} as const;

export const FEATURE_FLAGS = {
  richToasts: true,
};
