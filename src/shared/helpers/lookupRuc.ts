export type RucLookupResult = {
  ruc: string;
  razonSocial: string;
  direccion: string;
};

const normalizeText = (value: unknown) => String(value ?? "").trim();

const pickFirst = (...values: unknown[]) =>
  values.map(normalizeText).find((value) => value.length > 0) ?? "";

export const normalizeRuc = (value: unknown) =>
  String(value ?? "").replace(/\D/g, "");

export const isValidRuc = (value: unknown) => /^\d{11}$/.test(normalizeRuc(value));

export const lookupRuc = async (rucValue: unknown): Promise<RucLookupResult> => {
  const ruc = normalizeRuc(rucValue);
  if (!isValidRuc(ruc)) {
    throw new Error("El RUC debe tener 11 digitos numericos.");
  }

  const token = normalizeText(import.meta.env.VITE_API_DOCUMENTO);
  if (!token) {
    throw new Error("Falta configurar VITE_API_DOCUMENTO en el .env");
  }

  const response = await fetch(
    `https://dniruc.apisperu.com/api/v1/ruc/${encodeURIComponent(ruc)}?token=${encodeURIComponent(token)}`,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error("No se pudo consultar el RUC.");
  }

  const responseBody: unknown = await response.json();
  if (!responseBody || typeof responseBody !== "object") {
    throw new Error("No se encontraron datos para ese RUC.");
  }

  const payloadData = responseBody as Record<string, unknown>;
  const nestedResponse =
    payloadData.response &&
    typeof payloadData.response === "object" &&
    (payloadData.response as Record<string, unknown>).data &&
    typeof (payloadData.response as Record<string, unknown>).data === "object"
      ? ((payloadData.response as Record<string, unknown>).data as Record<
          string,
          unknown
        >)
      : payloadData;

  const apiMessage = pickFirst(
    nestedResponse.message,
    nestedResponse.error,
    (nestedResponse as { errors?: unknown }).errors,
  );

  if (nestedResponse.success === false) {
    throw new Error(apiMessage || "No se encontraron datos para ese RUC.");
  }

  const razonSocial = pickFirst(
    nestedResponse.razonSocial,
    nestedResponse.nombreORazonSocial,
    nestedResponse.nombre_o_razon_social,
    nestedResponse.nombre,
    nestedResponse.nombreRazon,
  );

  if (!razonSocial) {
    throw new Error(apiMessage || "No se encontraron datos para ese RUC.");
  }

  return {
    ruc: pickFirst(nestedResponse.ruc, ruc),
    razonSocial,
    direccion: pickFirst(
      nestedResponse.direccion,
      nestedResponse.direccionCompleta,
      nestedResponse.domicilioFiscal,
    ),
  };
};
