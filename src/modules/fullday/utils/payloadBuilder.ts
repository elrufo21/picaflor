import type { CanalOption, SelectOption } from "../hooks/canalUtils";


type FormValues = any; // We can improve this type if we export it from the page or define a shared type

interface BuildPayloadParams {
  values: FormValues;
  user: any;
  pkg: any;
  id: string | undefined;
  partidas: { value: string; label: string }[] | undefined;
  hoteles: { value: string; label: string }[] | undefined;
  almuerzos: { value: string; label: string }[] | undefined;
  actividades: { value: string; label: string }[] | undefined;
  trasladosOptions: { value: string; label: string }[] | undefined;
  tarifaRows: any[];
  tarifaTotal: number;
}

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getLabelByValue = (
  options: { value: string; label: string }[] | undefined,
  value: unknown
) => {
  const key = String(value ?? "").trim();
  if (!key || key === "-") return "";
  const found = options?.find((opt) => opt.value === key);
  return found?.label ?? key;
};

const extractOptionValue = (option?: SelectOption | CanalOption | null) =>
  typeof option === "string" ? option : option?.value ?? "";

const normalizeCondicion = (value: unknown) => {
  const raw = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (!raw) return "";
  if (raw.includes("cancel")) return "CONTADO";
  if (raw.includes("cuenta")) return "ACUENTA";
  if (raw.includes("credit")) return "CREDITO";
  return String(value ?? "").trim();
};

const buildDetalle = ({
  values,
  tarifaRows,
  almuerzos,
  actividades,
  trasladosOptions,
}: {
  values: FormValues;
  tarifaRows: any[];
  almuerzos: any[];
  actividades: any[];
  trasladosOptions: any[];
}) => {
  const resolveActividad = (rowId: string) => {
    if (rowId === "tarifaTour") {
      return getLabelByValue(almuerzos, values.tarifaTour);
    }
    if (rowId === "actividad1") {
      return getLabelByValue(actividades, values.actividad1);
    }
    if (rowId === "actividad2") {
      return getLabelByValue(actividades, values.actividad2);
    }
    if (rowId === "actividad3") {
      return getLabelByValue(actividades, values.actividad3);
    }
    if (rowId === "traslados") {
      return getLabelByValue(trasladosOptions, values.traslados);
    }
    if (rowId === "entradas") {
      return String(values.entradas ?? "").trim();
    }
    return "";
  };

  return tarifaRows
    .map((row) => {
      const actividad = resolveActividad(row.id);
      const cantidadRow = toNumber(row.cantidad);
      const precioRow = toNumber(row.precioUnit);
      if (!actividad || cantidadRow <= 0) return null;
      return {
        actividad,
        precio: precioRow,
        cantidad: cantidadRow,
        importe: Number((precioRow * cantidadRow).toFixed(2)),
      };
    })
    .filter(Boolean);
};

export const buildOrdenPayload = ({
  values,
  user,
  pkg,
  id,
  partidas,
  hoteles,
  almuerzos,
  actividades,
  trasladosOptions,
  tarifaRows,
  tarifaTotal,
}: BuildPayloadParams) => {
  const subtotal = tarifaTotal;
  const adicional =
    toNumber(values.cargosExtras) + toNumber(values.cobroExtraSol);
  const igv = toNumber(values.impuesto);
  const total = subtotal + igv + adicional;
  const acuentaValue = toNumber(values.acuenta);
  const saldo = total - acuentaValue;
  const notaEstado = saldo <= 0 ? "CANCELADO" : "PENDIENTE";
  const canal = values.canalVenta ?? null;
  const puntoPartidaLabel = getLabelByValue(partidas, values.puntoPartida);
  const hotelLabel = getLabelByValue(hoteles, values.hotel);
  const incluyeAlmuerzo =
    String(values.tarifaTour ?? "").trim() &&
    String(values.tarifaTour ?? "").trim() !== "-"
      ? "SI"
      : "NO";
  const notaDocuValue = String(values.documentoCobranza ?? "").trim();
  const monedaValue = String(values.moneda ?? "").trim().toUpperCase();
  const monedaLabel =
    monedaValue === "PEN" ? "SOLES" : monedaValue === "USD" ? "DOLARES" : monedaValue;
  const condicionRaw = extractOptionValue(values.condicion);
  const notaCondicion = normalizeCondicion(condicionRaw);

  return {
    orden: {
      notaDocu: notaDocuValue || "DOCUMENTO COBRANZA",
      clienteId: 1,
      notaUsuario: user?.username ?? user?.displayName ?? "",
      notaFormaPago: values.medioPago ?? "",
      notaCondicion,
      notaTelefono: values.telefono || values.celular || "",

      notaSubtotal: subtotal,
      notaTotal: total,
      notaAcuenta: acuentaValue,
      notaSaldo: saldo,
      notaAdicional: adicional,
      notaPagar: total,

      notaEstado,
      companiaId: toNumber(user?.companyId),
      incluyeIGV: igv > 0 ? "SI" : "N/A",
      serie: values.nserie ?? "",
      numero: values.ndocumento ?? "",
      notaGanancia: 0,

      usuarioId: toNumber(user?.id ?? user?.personalId),
      entidadBancaria: values.entidadBancaria ?? "",
      nroOperacion: values.nroOperacion ?? "",

      efectivo: toNumber(values.efectivo),
      deposito: toNumber(values.deposito),

      idProducto: Number(id ?? 0),
      auxiliar:
        (canal as CanalOption | null)?.auxiliar ??
        (canal as CanalOption | null)?.label ??
        (canal as CanalOption | null)?.value ??
        (canal as CanalOption | null)?.contacto ??
        "",
      telefonoAuxiliar: (canal as CanalOption | null)?.telefono ?? "",
      cantidadPax: toNumber(values.cantPax),

      puntoPartida: puntoPartidaLabel || values.puntoPartida || "",
      horaPartida: values.horaPresentacion ?? "",
      otrasPartidas: values.otrosPartidas ?? "",
      visitasExCur: values.visitas ?? "",

      cobroExtraSol: toNumber(values.cobroExtraSol),
      cobroExtraDol: toNumber(values.cobroExtraDol),
      fechaAdelanto: values.fechaPago ?? "",

      mensajePasajero: values.notas ?? "",
      observaciones: values.notas ?? "",

      islas: "",
      tubulares: "",
      otros: "",

      fechaViaje: values.fechaViaje,
      igv,
      incluyeCargos: adicional > 0 ? "SI" : "NO",
      monedas: monedaLabel,
      incluyeAlmuerzo,

      notaImagen: "-",
      hotel: hotelLabel || values.hotel || "",
      region: pkg?.region ?? "",
    },
    detalle: buildDetalle({
      values,
      tarifaRows,
      almuerzos: almuerzos || [],
      actividades: actividades || [],
      trasladosOptions: trasladosOptions || [],
    }),
  };
};

const ordenFieldOrder = [
  "notaDocu",
  "clienteId",
  "notaUsuario",
  "notaFormaPago",
  "notaCondicion",
  "notaTelefono",
  "notaSubtotal",
  "notaTotal",
  "notaAcuenta",
  "notaSaldo",
  "notaAdicional",
  "notaPagar",
  "notaEstado",
  "companiaId",
  "incluyeIGV",
  "serie",
  "numero",
  "notaGanancia",
  "usuarioId",
  "entidadBancaria",
  "nroOperacion",
  "efectivo",
  "deposito",
  "idProducto",
  "auxiliar",
  "telefonoAuxiliar",
  "cantidadPax",
  "puntoPartida",
  "horaPartida",
  "otrasPartidas",
  "visitasExCur",
  "cobroExtraSol",
  "cobroExtraDol",
  "fechaAdelanto",
  "mensajePasajero",
  "observaciones",
  "islas",
  "tubulares",
  "otros",
  "fechaViaje",
  "igv",
  "incluyeCargos",
  "monedas",
  "incluyeAlmuerzo",
  "notaImagen",
  "hotel",
  "region",
];

const serializeValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return text.replace(/\r?\n/g, " ").trim();
};

const legacyNumericKeys = new Set([
  "clienteId",
  "notaSubtotal",
  "notaTotal",
  "notaAcuenta",
  "notaSaldo",
  "notaAdicional",
  "notaPagar",
  "companiaId",
  "notaGanancia",
  "usuarioId",
  "efectivo",
  "deposito",
  "idProducto",
  "cantidadPax",
  "cobroExtraSol",
  "cobroExtraDol",
  "igv",
]);

const serializeLegacyValue = (key: string, value: unknown) => {
  const normalized = serializeValue(value);
  if (!normalized && legacyNumericKeys.has(key)) return "0";
  if (!normalized && key === "entidadBancaria") return "-";
  if (!normalized && (key === "islas" || key === "tubulares" || key === "otros"))
    return "";
  return normalized;
};

export const buildLegacyPayloadString = (payload: {
  orden: Record<string, unknown>;
  detalle: Array<{
    actividad?: unknown;
    precio?: unknown;
    cantidad?: unknown;
    importe?: unknown;
  }>;
}) => {
  const values = ordenFieldOrder.map((key) =>
    serializeLegacyValue(key, payload.orden?.[key])
  );

  const detalle = (payload.detalle ?? [])
    .map((row) =>
      [
        serializeValue(row.actividad),
        serializeValue(row.precio),
        serializeValue(row.cantidad),
        serializeValue(row.importe),
      ].join("|")
    )
    .join(";");

  return `${values.join("|")}[${detalle}`;
};

export const parseLegacyPayloadString = (text: string) => {
  const raw = String(text ?? "");
  const detailStart = raw.indexOf("[");
  const detailEnd = raw.lastIndexOf("]");
  const ordenPart =
    detailStart >= 0 ? raw.slice(0, detailStart).trim() : raw.trim();
  const detallePart =
    detailStart >= 0
      ? detailEnd > detailStart
        ? raw.slice(detailStart + 1, detailEnd)
        : raw.slice(detailStart + 1)
      : "";
  const ordenJoined = ordenPart.split(/\r?\n/).join("|");
  const values = ordenJoined ? ordenJoined.split("|") : [];
  const orden = ordenFieldOrder.reduce<Record<string, string>>((acc, key, i) => {
    acc[key] = values[i] ?? "";
    return acc;
  }, {});

  const detalle = detallePart
    ? detallePart.split(";").map((row) => {
        const [actividad = "", precio = "", cantidad = "", importe = ""] =
          row.split("|");
        return { actividad, precio, cantidad, importe };
      })
    : [];

  return { orden, detalle };
};
