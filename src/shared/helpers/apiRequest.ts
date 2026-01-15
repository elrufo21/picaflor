import axios, { type AxiosRequestConfig, type Method } from "axios";

interface ApiRequestParams<TBody = unknown, TFallback = unknown> {
  url: string;
  method?: Method;
  data?: TBody | null;
  config?: AxiosRequestConfig;
  fallback?: TFallback;
}

const DATE_PREFIX_RE = /^\d{4}-\d{2}-\d{2}(?:$|[T\s])/;

const padDatePart = (value: number) => String(value).padStart(2, "0");

const toDateOnly = (value: Date) => {
  const year = value.getFullYear();
  const month = padDatePart(value.getMonth() + 1);
  const day = padDatePart(value.getDate());
  return `${year}-${month}-${day}`;
};

const normalizeDateString = (value: string) => {
  const trimmed = value.trim();
  if (!DATE_PREFIX_RE.test(trimmed)) return value;
  return trimmed.slice(0, 10);
};

const normalizeFormData = (data: FormData) => {
  const normalized = new FormData();
  data.forEach((value, key) => {
    if (typeof value === "string") {
      normalized.append(key, normalizeDateString(value));
      return;
    }
    normalized.append(key, value);
  });
  return normalized;
};

const normalizeDatePayload = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return toDateOnly(value);
  if (typeof value === "string") return normalizeDateString(value);
  if (value instanceof FormData) return normalizeFormData(value);
  if (value instanceof Blob) return value;
  if (Array.isArray(value)) return value.map(normalizeDatePayload);
  if (typeof value !== "object") return value;

  const record = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};
  Object.entries(record).forEach(([key, entry]) => {
    normalized[key] = normalizeDatePayload(entry);
  });
  return normalized;
};

export async function apiRequest<
  TResponse = unknown,
  TBody = unknown,
  TFallback = unknown
>({
  url,
  method = "GET",
  data = null,
  config = {},
  fallback,
}: ApiRequestParams<TBody, TFallback>): Promise<TResponse | TFallback> {
  try {
    const normalizedData =
      data === null || data === undefined ? data : normalizeDatePayload(data);
    const response = await axios({
      url,
      method,
      data: normalizedData,
      ...config,
    });
    let result = response.data;

    if (typeof result === "string" && result.includes("<!doctype html")) {
      console.warn("⚠️ El api no existe", url);
      return fallback as TFallback;
    }
    console.log("response", result);

    return result;
  } catch (err) {
    console.error("⚠️ Error del api", err);
    if (typeof fallback !== "undefined") {
      return fallback;
    }
    throw err;
  }
}
